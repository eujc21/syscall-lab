# Running Playbooks

## Kafka Cluster (`kafka_cluster.yml`)

This playbook installs and configures a Kafka cluster.

### Prerequisites

1.  **Inventory:** Ensure your target hosts are defined in an Ansible inventory file (e.g., `cluster/inventory/hosts.example` or a custom one). You should copy `cluster/inventory/hosts.example` to `cluster/inventory/hosts` and customize it for your environment.
### 2. SSH Access and Private Key Configuration

Secure Shell (SSH) keys are used to establish a secure connection between your Ansible control node (where you run `ansible-playbook`) and the target machines. Using SSH keys is more secure and convenient than password-based authentication.

**a. Check for Existing SSH Keys:**
Before generating a new key, check if you already have one:
```bash
ls -al ~/.ssh/id_*.pub
```
If you see files like `id_rsa.pub`, `id_ed25519.pub`, etc., you already have keys and can likely reuse them.

**b. Generate a New SSH Key Pair (if needed):**
If you don't have an SSH key or want to use a new one, generate it using `ssh-keygen`:
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```
This command creates a private key (e.g., `~/.ssh/id_rsa`) and a public key (`~/.ssh/id_rsa.pub`). **Keep your private key secure and do not share it.**

**c. Distribute Your Public Key to Target Servers:**
For Ansible to connect, the public key of your control node must be present in the `~/.ssh/authorized_keys` file on each target server for the user Ansible will connect as (e.g., `ansible_user` defined in your inventory). The easiest way to do this is using `ssh-copy-id`:
```bash
ssh-copy-id remote_user@target_server_ip_or_hostname
```
Replace `remote_user` with the username Ansible will use to connect to the server, and `target_server_ip_or_hostname` with the server's address. You'll be prompted for the user's password on the target server this one time.

**d. Configure Ansible to Use Your Private Key:**
Ansible needs to know which private key to use for SSH connections. You can specify this in several ways:

*   **Inventory `ansible_ssh_private_key_file`:** (Recommended for consistency)
    You can set the `ansible_ssh_private_key_file` variable for your hosts or groups in your inventory file. The provided `cluster/inventory/hosts.example` file shows an example:
    ```ini
    [all:vars]
    ansible_ssh_private_key_file=~/.ssh/your_kafka_cluster_key 
    ```
    You would replace `~/.ssh/your_kafka_cluster_key` with the actual path to your private key if it's different.

*   **Command-line `--private-key` option:**
    You can specify the private key when running `ansible-playbook`:
    ```bash
    ansible-playbook --private-key /path/to/your/private_key ...
    ```

*   **SSH Agent or Default Key Locations:**
    If your private key is managed by an SSH agent or is located in default paths like `~/.ssh/id_rsa` or `~/.ssh/id_ed25519`, Ansible might pick it up automatically if not otherwise specified.

Ensure your SSH setup allows connection to the target hosts before running playbooks.

### Running the Playbook

To run the Kafka cluster playbook, you need to specify the target hosts using the `kafka_target_hosts` extra variable.

**Command:**

```bash
ansible-playbook \
  -i /path/to/your/inventory_file \
  --extra-vars "kafka_target_hosts=your_kafka_host1,your_kafka_host2,your_kafka_host3" \
  cluster/kafka_cluster.yml
```

**Explanation:**

*   `-i /path/to/your/inventory_file`: Specifies the path to your Ansible inventory file. You can use `cluster/inventory/hosts.example` (after copying it to `cluster/inventory/hosts` and customizing) if your hosts are defined there and you've updated it for the new targets.
*   `--extra-vars "kafka_target_hosts=your_kafka_host1,your_kafka_host2,your_kafka_host3"`: This is **mandatory**. Replace `your_kafka_host1,your_kafka_host2,...` with the actual hostnames or IP addresses of the servers where you want to deploy Kafka. These hosts should be present in your inventory file.
*   `cluster/kafka_cluster.yml`: The path to the playbook file.

**Example using the default inventory and targeting specific hosts:**

If your `cluster/inventory/hosts.example` (copied to `cluster/inventory/hosts` and modified) file is set up correctly for `hostA` and `hostB`, you could run:

```bash
ansible-playbook \
  -i cluster/inventory/hosts \
  --extra-vars "kafka_target_hosts=hostA,hostB" \
  cluster/kafka_cluster.yml
```

Remember to replace `hostA,hostB` with the actual hostnames or group names defined in your inventory that you wish to target.

### KRAFT Node Roles (`kafka_node_role`)

To properly configure KRAFT, each node in your `kafka_target_hosts` list must have the `kafka_node_role` variable defined in the inventory. This variable tells the playbook whether a node should act as a combined controller and broker, or just a broker.

*   **`kafka_node_role=controller_broker`**: Assign this to nodes that will participate in the KRAFT controller quorum and also act as brokers.
*   **`kafka_node_role=broker`**: Assign this to nodes that will only act as brokers.

**Example Inventory Configuration:**

```ini
[my_kafka_cluster]
kafka_node1.example.com ansible_host=192.168.1.101 ansible_user=your_ssh_user node_id=1 kafka_node_role=controller_broker
kafka_node2.example.com ansible_host=192.168.1.102 ansible_user=your_ssh_user node_id=2 kafka_node_role=controller_broker
kafka_node3.example.com ansible_host=192.168.1.103 ansible_user=your_ssh_user node_id=3 kafka_node_role=controller_broker
kafka_node4.example.com ansible_host=192.168.1.104 ansible_user=your_ssh_user node_id=4 kafka_node_role=broker
```

Ensure this variable is set for each host targeted by the `kafka_cluster.yml` playbook. The playbook uses this variable to configure the `kraft_roles` setting for each Kafka instance.

### Kafka Cluster Group Variables

When defining your Kafka cluster hosts in the inventory, you'll typically group them (e.g., `[my_kafka_cluster]`). For this group, you need to define several variables under `[my_kafka_cluster:vars]` that are critical for the KRAFT setup. These variables are applied to all hosts within that group.

Refer to the `cluster/inventory/hosts.example` file for context (look for `[kafka_cluster_nodes:vars]`).

*   `kraft_controller_quorum_voters`:
    *   **Purpose**: Defines the list of controller nodes that form the KRAFT quorum. Each entry specifies the `node_id`, `hostname/IP`, and `port` for a controller.
    *   **Format**: A comma-separated string of `node_id@host:port`. The `node_id` must match the `node_id` variable defined for each respective host in your inventory (e.g., `kafka_node1 node_id=1`). The host part should be the address of the controller node, and the port is typically `9093`.
    *   **Example (for 3 controllers with node IDs 1, 2, 3)**: `"1@kafka_node1.example.com:9093,2@kafka_node2.example.com:9093,3@kafka_node3.example.com:9093"`
    *   **Note**: Ensure the `node_id` specified here matches the `node_id` assigned to the individual host entries in your inventory. The host IPs/hostnames must be reachable by other nodes in the cluster.

*   `kraft_advertised_listeners`:
    *   **Purpose**: Specifies the listeners that Kafka brokers will advertise to clients. This is how clients outside the Kafka cluster will connect to the brokers.
    *   **Format**: Typically `PLAINTEXT://{{ ansible_host }}:9092`. The `{{ ansible_host }}` variable (resolved by Ansible for each host) is often used here to advertise the primary IP address of the broker. `9092` is the standard Kafka client port.
    *   **Example**: `"PLAINTEXT://{{ ansible_host }}:9092"` (This is a common setting and usually doesn't need to change unless you have specific network configurations like NAT).

*   `kraft_listeners`:
    *   **Purpose**: Defines the listeners the Kafka brokers and controllers will bind to on the local machine.
    *   **Format**: A comma-separated string defining listener types, IP addresses to bind to, and ports. For KRAFT, this typically includes a `PLAINTEXT` listener for client connections and a `CONTROLLER` listener for inter-controller communication.
    *   **Example**: `"PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093"`
        *   `PLAINTEXT://0.0.0.0:9092`: Listens on all network interfaces (0.0.0.0) on port 9092 for client connections.
        *   `CONTROLLER://0.0.0.0:9093`: Listens on all network interfaces on port 9093 for KRAFT controller communication.

*   `kraft_cluster_id`:
    *   **Purpose**: A unique ID for your Kafka KRAFT cluster. This ID is used by KRAFT to identify the cluster and should be the same for all nodes in the cluster.
    *   **Format**: A base64 URL-safe encoded string. You can generate one using tools like `kafka-storage.sh random-uuid` (from a Kafka installation) or other UUID generators.
    *   **Example**: `"please_generate_and_paste_a_uuid_here"`
    *   **Important**: Generate this once for your cluster and use the same ID for all nodes. Do not change it after the cluster is initialized.

These variables are essential for a correctly functioning KRAFT-based Kafka cluster. Ensure they are accurately configured in your inventory file for the group containing your Kafka hosts.
