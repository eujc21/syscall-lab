# Redis Cluster Deployment with Ansible

This Ansible role automates the installation, configuration, and clustering of Redis across multiple nodes running Rocky Linux. It supports SELinux enforcement, systemd supervision, and cluster bootstrapping.

---

## 🚀 Features

- Installs Redis via native Rocky Linux package manager
- Ensures memory overcommit is configured for Redis
- Configures systemd overrides for supervised Redis
- Sets up SELinux policies and file contexts for Redis
- Manages Redis cluster ports in firewalld
- Waits for Redis availability and verifies cluster state
- Automatically initializes Redis cluster from primary node

---

## 📦 Requirements

- Ansible ≥ 2.14
- Rocky Linux 8 or later
- SELinux enabled (optional, auto-detected)
- `redis-cli` must be available on all hosts

---

## 🔧 Role Variables

| Variable              | Description                                      | Default        |
|-----------------------|--------------------------------------------------|----------------|
| `redis_user`          | User running Redis                               | `redis`        |
| `redis_group`         | Group running Redis                              | `redis`        |
| `redis_data_dir`      | Data directory for Redis                         | `/var/lib/redis` |
| `redis_port`          | Redis client port                                | `6379`         |
| `cluster_bus_port`    | Redis cluster bus port (required for clustering) | `16379`        |
| `static_ipv4`         | IP address of the current host (for wait_for)    | -              |
| `redis_cluster_enabled` | Whether to bootstrap the cluster               | `true`         |

> These should be defined in `group_vars` or inventory.

---

## 🖥️ Usage

Add this role to your playbook:

```yaml
- hosts: jaguar_cluster
  become: yes
  roles:
    - redis
```

Ensure that your inventory defines the group `jaguar_cluster` with at least 3 nodes for clustering. Only the first host in the group (`groups['jaguar_cluster'][0]`) will run the `redis-cli --cluster create` command.

---

## 📂 Template Required

Ensure your role includes a Jinja2 template at:

```
templates/redis.conf.j2
```

This file should be a valid `redis.conf` template with variables like:

```jinja2
port {{ redis_port }}
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
dir {{ redis_data_dir }}
```

---

## ✅ Handlers

Make sure your role defines handlers to reload and restart Redis when needed:

```yaml
handlers:
  - name: Reload and Restart Redis
    systemd:
      name: redis
      state: restarted
      daemon_reload: yes

  - name: restart redis
    systemd:
      name: redis
      state: restarted
```

---

## 📋 TODOs / Improvements

- [ ] Add support for authentication (`requirepass`, `masterauth`)
- [ ] Add optional Redis version pinning
- [ ] Validate `redis-cli` is installed and reachable before cluster tasks
- [ ] Create `verify_cluster_health.sh` helper
- [ ] Add idempotency guard for cluster creation (based on known node IDs)
- [ ] Add tags (`setup`, `cluster`, `firewall`, `selinux`) for fine-grained control
- [ ] Create Molecule tests for RHEL-based environments

---

## 📚 References

- [Redis Cluster Specification](https://redis.io/docs/latest/operate/oss_and_stack/cluster/)
- [Ansible sysctl module](https://docs.ansible.com/ansible/latest/collections/ansible/posix/sysctl_module.html)
- [SELinux policy](https://github.com/SELinuxProject/selinux-notebook)
- [Rocky Linux Redis package](https://pkgs.org/search/?q=redis)

---

## 🧪 Example Inventory

```ini
[jaguar_cluster]
jag1 static_ipv4=192.168.100.11
jag2 static_ipv4=192.168.100.12
jag3 static_ipv4=192.168.100.13
```

---

## 📌 License

MIT

