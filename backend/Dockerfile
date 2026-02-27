# ══════════════════════════════════════════════════════════════
# Dressly — Backend Dockerfile (Multi-stage Rust Build)
# ══════════════════════════════════════════════════════════════

# Stage 1: Build
FROM rust:1.77-slim-bookworm AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Build application
COPY . .
RUN touch src/main.rs && cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r dressly && useradd -r -g dressly -s /bin/false dressly

WORKDIR /app

COPY --from=builder /app/target/release/dressly-backend ./dressly-backend
COPY --from=builder /app/src/db/migrations ./migrations

RUN chown -R dressly:dressly /app

USER dressly

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["./dressly-backend"]
