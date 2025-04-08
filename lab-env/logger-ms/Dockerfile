# logger-ms/Dockerfile
FROM rust:latest as builder

# Set workdir to app path
WORKDIR /usr/src/app

# Copy Cargo files and source code
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
COPY src ./src

# Build release binary
RUN cargo build --release
