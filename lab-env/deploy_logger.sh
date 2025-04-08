#!/usr/bin/env bash

# === CONFIGURATION ===
REMOTE_HOST="jaguar@10.0.0.61"                # Change to your target machine
REMOTE_PATH="/usr/local/bin/logger-ms"          # Destination path on target
BINARY_NAME="logger-ms"
PACKAGE_DIR="logger-ms"
USE_CONTAINER_BUILD=true                        # Change to false for local cargo build

set -e

echo "🔧 Building Rust binary for $BINARY_NAME..."

if [ "$USE_CONTAINER_BUILD" = true ]; then
    echo "📦 Building inside container..."
    podman build --no-cache -t ${BINARY_NAME}-builder -f ${PACKAGE_DIR}/Dockerfile ${PACKAGE_DIR}

    echo "📦 Creating container and extracting binary..."
    podman create --name temp-${BINARY_NAME} ${BINARY_NAME}-builder
    podman cp temp-${BINARY_NAME}:/usr/src/app/target/release/${BINARY_NAME} ./${BINARY_NAME}
    podman rm temp-${BINARY_NAME}
else
    echo "🛠 Building locally with cargo..."
    (cd ${PACKAGE_DIR} && cargo build --release)
    cp ${PACKAGE_DIR}/target/release/${BINARY_NAME} ./
fi

echo "📤 Sending binary to $REMOTE_HOST..."
rsync -avz ./${BINARY_NAME} ${REMOTE_HOST}:/tmp/${BINARY_NAME}

echo "🚀 Installing binary on remote host..."
ssh ${REMOTE_HOST} << EOF
    sudo mv /tmp/${BINARY_NAME} ${REMOTE_PATH}
    sudo chmod +x ${REMOTE_PATH}
    echo "✅ Installed to ${REMOTE_PATH}"
EOF

echo "✅ Done!"
