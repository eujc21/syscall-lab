#!/bin/bash

# Create directory structure
mkdir -p roles/kafka/{tasks,vars,templates,handlers,meta}

# Create main tasks file
cat > roles/kafka/tasks/main.yml << 'EOF'
---
- include_tasks: install.yml
  tags: kafka-install

- include_tasks: configure.yml
  tags: kafka-configure

- include_tasks: producers.yml
  tags: kafka-producers

- include_tasks: consumers.yml
  tags: kafka-consumers

- include_tasks: hardening.yml
  tags: kafka-hardening
EOF

# Create installation tasks
cat > roles/kafka/tasks/install.yml << 'EOF'
---
- name: Install Java (OpenJDK 11)
  become: true
  dnf:
    name: java-11-openjdk-devel
    state: present
  tags: kafka-install

- name: Create Kafka group
  become: true
  group:
    name: kafka
    state: present
    system: yes
  tags: kafka-install

- name: Create Kafka user
  become: true
  user:
    name: kafka
    group: kafka
    comment: Kafka User
    home: /opt/kafka
    create_home: yes
    system: yes
    shell: /bin/bash
  tags: kafka-install

- name: Create Kafka install directory
  become: true
  file:
    path: "{{ kafka_install_dir }}"
    state: directory
    owner: kafka
    group: kafka
    mode: '0755'
  tags: kafka-install

- name: Download Kafka
  get_url:
    url: "{{ kafka_download_url }}"
    dest: /tmp/kafka_{{ kafka_version }}.tgz
    checksum: "sha512:{{ kafka_checksum }}"
  tags: kafka-install

- name: Extract Kafka archive
  become: true
  unarchive:
    src: /tmp/kafka_{{ kafka_version }}.tgz
    dest: "{{ kafka_install_dir }}"
    owner: kafka
    group: kafka
    creates: "{{ kafka_install_dir }}/kafka_{{ kafka_scala_version }}-{{ kafka_version }}"
    remote_src: yes
  tags: kafka-install

- name: Create symbolic link for Kafka directory
  become: true
  file:
    src: "{{ kafka_install_dir }}/kafka_{{ kafka_scala_version }}-{{ kafka_version }}"
    dest: "{{ kafka_install_dir }}/current"
    state: link
    owner: kafka
    group: kafka
  tags: kafka-install

- name: Create Kafka data directory
  become: true
  file:
    path: "{{ kafka_data_dir }}"
    state: directory
    owner: kafka
    group: kafka
    mode: '0755'
  tags: kafka-install

- name: Create Kafka log directory
  become: true
  file:
    path: "{{ kafka_log_dir }}"
    state: directory
    owner: kafka
    group: kafka
    mode: '0755'
  tags: kafka-install
EOF

# Create configuration tasks
cat > roles/kafka/tasks/configure.yml << 'EOF'
---
- name: Create Kafka configuration directory
  become: true
  file:
    path: "{{ kafka_config_dir }}"
    state: directory
    owner: kafka
    group: kafka
    mode: '0755'
  tags: kafka-configure

- name: Template Kafka server.properties
  become: true
  template:
    src: server.properties.j2
    dest: "{{ kafka_config_dir }}/server.properties"
    owner: kafka
    group: kafka
    mode: '0644'
  notify: restart_kafka
  tags: kafka-configure

- name: Template Kafka zookeeper.properties (if needed - embedded example)
  become: true
  template:
    src: zookeeper.properties.j2
    dest: "{{ kafka_config_dir }}/zookeeper.properties"
    owner: kafka
    group: kafka
    mode: '0644'
  notify: restart_kafka
  tags: kafka-configure

- name: Template Kafka systemd service unit
  become: true
  template:
    src: kafka.service.j2
    dest: /etc/systemd/system/kafka.service
    owner: root
    group: root
    mode: '0644'
  notify: restart_kafka
  tags: kafka-configure

- name: Enable and start Kafka service
  become: true
  systemd:
    name: kafka
    state: started
    enabled: yes
  tags: kafka-configure
EOF

# Create producer tasks
cat > roles/kafka/tasks/producers.yml << 'EOF'
---
- name: "Placeholder for Producer specific broker configurations (if needed)"
  debug:
    msg: "Producer configurations can be managed at the broker level (e.g., resource limits, quotas) if required. Application-level producer configurations are typically handled in the producer applications themselves."
  tags: kafka-producers
EOF

# Create consumer tasks
cat > roles/kafka/tasks/consumers.yml << 'EOF'
---
- name: "Placeholder for Consumer specific broker configurations (if needed)"
  debug:
    msg: "Consumer configurations are primarily application-level. Broker-level configurations related to consumers might include quotas or specific ACLs if needed."
  tags: kafka-consumers
EOF

# Create hardening tasks
cat > roles/kafka/tasks/hardening.yml << 'EOF'
---
- name: Ensure Kafka configuration files are only readable by kafka user
  become: true
  file:
    path: "{{ kafka_config_dir }}"
    recurse: yes
    mode: '0600'
  tags: kafka-hardening

- name: Configure firewall for Kafka port (9092 by default)
  become: true
  firewalld:
    port: "{{ kafka_broker_port }}/tcp"
    permanent: yes
    state: enabled
    immediate: yes
  when: firewall_enabled | bool
  tags: kafka-hardening

- name: "Consider further hardening steps (ACLs, TLS/SSL, JMX Authentication, etc.)"
  debug:
    msg: "For production environments, implement more robust hardening: ACLs, TLS/SSL encryption for inter-broker and client communication, JMX authentication, secure Zookeeper access, and regular security audits."
  tags: kafka-hardening
EOF

# Create variables file
cat > roles/kafka/vars/main.yml << 'EOF'
---
kafka_version: 3.6.1
kafka_scala_version: 2.13
kafka_download_url: "https://archive.apache.org/dist/kafka/{{ kafka_version }}/kafka_{{ kafka_scala_version }}-{{ kafka_version }}.tgz"
kafka_checksum: "your_kafka_checksum_here"  # IMPORTANT: Replace with actual SHA-512 checksum

kafka_install_dir: /opt/kafka
kafka_config_dir: "{{ kafka_install_dir }}/current/config"
kafka_data_dir: /var/lib/kafka-data
kafka_log_dir: /var/log/kafka

kafka_broker_port: 9092
kafka_zookeeper_port: 2181

kafka_heap_opts: "-Xmx2G -Xms2G"

# Cluster Configuration
broker_id_prefix: 1000
listeners: "PLAINTEXT://:{{ kafka_broker_port }}"
advertised_listeners: "PLAINTEXT://{{ static_ipv4 }}:{{ kafka_broker_port }}"
zookeeper_connect: "{{ groups['jaguar_cluster'] | map('extract', hostvars, ['static_ipv4']) | map('regex_replace', '(.*)', '\\1:{{ kafka_zookeeper_port }}') | join(',') }}"
log_dirs: "{{ kafka_data_dir }}/kafka-logs"
auto_create_topics_enable: true
delete_topic_enable: true
default_replication_factor: 3
min_insync_replicas: 2

firewall_enabled: true
EOF

# Create server.properties template
cat > roles/kafka/templates/server.properties.j2 << 'EOF'
broker.id={{ broker_id_prefix + ansible_play_hosts.index(inventory_hostname) }}
listeners={{ listeners }}
advertised.listeners={{ advertised_listeners }}
log.dirs={{ log_dirs }}
zookeeper.connect={{ zookeeper_connect }}

# Topic Configuration Defaults
auto.create.topics.enable={{ auto_create_topics_enable }}
delete.topic.enable={{ delete_topic_enable }}
default.replication.factor={{ default_replication_factor }}
min.insync.replicas={{ min_insync_replicas }}

# Performance Tuning
num.io.threads=8
num.network.threads=3
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# Log Configuration
log.retention.hours=168
log.segment.bytes=1073741824
log.cleanup.policy=delete

# JVM Options
{{ kafka_heap_opts_property }}
EOF

# Create zookeeper.properties template
cat > roles/kafka/templates/zookeeper.properties.j2 << 'EOF'
# Example for separate Zookeeper configuration
tickTime=2000
dataDir=/var/lib/zookeeper
clientPort={{ kafka_zookeeper_port }}
initLimit=10
syncLimit=5
# server.1=zoo1:2888:3888
# server.2=zoo2:2888:3888
# server.3=zoo3:2888:3888
EOF

# Create kafka.service template
cat > roles/kafka/templates/kafka.service.j2 << 'EOF'
[Unit]
Description=Apache Kafka Broker
Requires=network.target remote-fs.target
After=network.target remote-fs.target

[Service]
Type=simple
User=kafka
Group=kafka
Environment="JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64"
Environment="KAFKA_HEAP_OPTS={{ kafka_heap_opts }}"
WorkingDirectory={{ kafka_install_dir }}/current
ExecStart=/bin/sh -c "{{ kafka_install_dir }}/current/bin/kafka-server-start.sh {{ kafka_config_dir }}/server.properties"
ExecStop=/bin/sh -c "{{ kafka_install_dir }}/current/bin/kafka-server-stop.sh"
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create handlers
cat > roles/kafka/handlers/main.yml << 'EOF'
---
- name: restart_kafka
  become: true
  systemd:
    name: kafka
    state: restarted
EOF

# Create meta file
cat > roles/kafka/meta/main.yml << 'EOF'
---
galaxy_info:
  role_name: kafka
  author: Your Name
  description: Ansible role to install and configure Apache Kafka
  min_ansible_version: "2.9"
  platforms:
    - name: Rocky
      versions:
        - all
  galaxy_tags:
    - kafka
    - messaging
    - distributed
    - bigdata

dependencies: []
EOF

# Create playbook
cat > kafka_cluster.yml << 'EOF'
---
- hosts: jaguar_cluster
  become: true
  roles:
    - role: kafka
  vars:
    kafka_heap_opts_property: "KAFKA_HEAP_OPTS={{ kafka_heap_opts }}"
EOF

echo "Kafka Ansible role setup complete!"
echo "Remember to:"
echo "1. Update the SHA-512 checksum in roles/kafka/vars/main.yml"
echo "2. Modify inventory.ini with your actual server details"
echo "3. Review all configuration files for your specific needs"
