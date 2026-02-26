# 🎨 DRESSLY — Ultra-Advanced System Design Document

> **Version:** 2.0.0 | **Last Updated:** 2026-02-26  
> **Classification:** Production-Grade | Meta-Level Architecture  
> **Target Scale:** 1–3 Million Concurrent Users  
> **Platforms:** iOS + Android (Cross-Platform)

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Tech Stack Deep Dive](#3-tech-stack-deep-dive)
4. [Data Architecture](#4-data-architecture)
5. [API Design](#5-api-design)
6. [Real-Time Communication (WebSocket)](#6-real-time-communication)
7. [AI/ML Pipeline — Gemini Integration](#7-aiml-pipeline)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Payment Gateway](#9-payment-gateway)
10. [Notification System](#10-notification-system)
11. [Security Architecture](#11-security-architecture)
12. [Scalability & Performance](#12-scalability--performance)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Monitoring & Observability](#14-monitoring--observability)
15. [Data Structures & Algorithms Used](#15-data-structures--algorithms)
16. [Folder Structure](#16-folder-structure)
17. [Testing Strategy](#17-testing-strategy)
18. [Cost Estimation](#18-cost-estimation)

---

## 1. Executive Summary

**Dressly** is an AI-powered fashion advisory mobile application that solves the real-world problem of outfit selection and dress code matching. Using Google's Gemini multimodal AI, users can upload multiple clothing images and receive AI-generated outfit combinations with style scores, occasion matching, and real-time fashion advice.

### Core Value Propositions
- **Real-time Dress Code Analysis** — AI analyzes outfit photos and suggests improvements
- **Multi-Image Outfit Generation** — Combine text + multiple clothing images → single styled outfit via Gemini
- **Occasion-Based Styling** — Match outfits to events (formal, casual, party, wedding, interview)
- **Pro Subscription** — Premium features with dynamic pricing controlled by admin
- **Cross-Platform** — Single codebase runs on both iOS and Android

### Business Model
| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0 | 5 AI generations/day, basic wardrobe, limited styles |
| Pro | ₹X/month (admin-controlled) | Unlimited generations, advanced AI, full wardrobe, priority support |

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │   iOS App    │  │ Android App  │  React Native (Expo) + TypeScript│
│  └──────┬───────┘  └──────┬───────┘                                │
│         │                 │                                         │
│         └────────┬────────┘                                         │
│                  │ HTTPS/WSS (TLS 1.3)                              │
└──────────────────┼──────────────────────────────────────────────────┘
                   │
┌──────────────────┼──────────────────────────────────────────────────┐
│              EDGE LAYER                                             │
│  ┌───────────────────────────┐                                      │
│  │  CloudFlare CDN + WAF     │  DDoS Protection, Rate Limiting      │
│  └─────────────┬─────────────┘                                      │
│                │                                                    │
│  ┌─────────────┴─────────────┐                                      │
│  │  Nginx Load Balancer      │  Round-Robin + Least Connections     │
│  │  (Sticky Sessions for WS) │                                      │
│  └─────────────┬─────────────┘                                      │
└────────────────┼────────────────────────────────────────────────────┘
                 │
┌────────────────┼────────────────────────────────────────────────────┐
│           APPLICATION LAYER (Rust — Actix-Web)                      │
│                │                                                    │
│  ┌─────────────┴─────────────┐                                      │
│  │     API Gateway Service   │                                      │
│  │  (Rate Limit, Auth, Route)│                                      │
│  └─────────────┬─────────────┘                                      │
│                │                                                    │
│  ┌─────────┬───┴───┬──────────┬──────────┬──────────┐               │
│  │ Auth    │ User  │ AI/ML    │ Payment  │ Notif    │               │
│  │ Service │ Svc   │ Service  │ Service  │ Service  │               │
│  └────┬────┘└──┬───┘└────┬────┘└────┬────┘└────┬────┘               │
│       │        │         │          │          │                    │
│  ┌────┴────────┴─────────┴──────────┴──────────┴────┐               │
│  │          WebSocket Manager (1:1 per user)         │               │
│  │    Tokio Runtime — Lock-free Concurrent HashMap   │               │
│  └──────────────────────┬───────────────────────────┘               │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│              DATA LAYER                                             │
│                         │                                           │
│  ┌──────────┐  ┌────────┴───┐  ┌───────────┐  ┌─────────────┐      │
│  │PostgreSQL│  │   Redis    │  │   S3/R2   │  │ Google      │      │
│  │ (Primary)│  │  (Cache +  │  │  (Media)  │  │ Gemini API  │      │
│  │ + Read   │  │  Sessions  │  │           │  │             │      │
│  │ Replicas │  │  + PubSub) │  │           │  │             │      │
│  └──────────┘  └────────────┘  └───────────┘  └─────────────┘      │
│                                                                     │
│  ┌──────────────────────────────────────────┐                       │
│  │  Message Queue: Redis Streams / NATS     │                       │
│  │  (Async task processing, event sourcing) │                       │
│  └──────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Patterns Used
- **Microservice-Ready Monolith** — Start as modular monolith, split when scale demands
- **CQRS (Command Query Responsibility Segregation)** — Separate read/write paths
- **Event-Driven Architecture** — Redis Streams for async processing
- **Actor Model** — Actix actor system for WebSocket connection management
- **Circuit Breaker** — For external API calls (Gemini, Payment Gateway)
- **Bulkhead Pattern** — Isolate critical paths from non-critical ones

---

## 3. Tech Stack Deep Dive

### Backend (Rust)
| Component | Technology | Why |
|-----------|-----------|-----|
| Language | **Rust 1.75+** | Zero-cost abstractions, memory safety without GC, 10x faster than Go/Node |
| Web Framework | **Actix-Web 4** | #1 TechEmpower benchmark, actor model, native async |
| Async Runtime | **Tokio** | Industry-standard async runtime, work-stealing scheduler |
| Database ORM | **SQLx** | Compile-time checked SQL queries, zero-overhead |
| WebSocket | **Actix-WS** | Native actor-based WebSocket with heartbeat |
| Serialization | **Serde + simd-json** | SIMD-accelerated JSON parsing, 2-4x faster |
| Authentication | **jsonwebtoken + argon2** | JWT tokens + Argon2id password hashing (OWASP recommended) |
| Caching | **Redis (deadpool-redis)** | Connection pooling, sub-millisecond latency |
| Logging | **tracing + tracing-subscriber** | Structured logging with span-based tracing |
| Config | **config-rs** | Hierarchical configuration (env, file, defaults) |
| Validation | **validator** | Derive-based request validation |
| Error Handling | **thiserror + anyhow** | Type-safe error propagation |
| Rate Limiting | **actix-governor** | Token bucket algorithm |
| CORS | **actix-cors** | Configurable CORS policies |
| Testing | **cargo test + criterion + proptest** | Unit, integration, property-based, benchmarks |

### Mobile App (Cross-Platform)
| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | **React Native 0.74+ (Expo SDK 51)** | Single codebase for iOS + Android, OTA updates |
| Language | **TypeScript 5.4+** | Type safety, better DX, fewer runtime errors |
| Navigation | **Expo Router v3** | File-based routing, deep linking, type-safe |
| State Management | **Zustand + Immer** | Lightweight, no boilerplate, immutable updates |
| Data Fetching | **TanStack Query v5** | Server state management, caching, optimistic updates |
| WebSocket | **Custom Hook (native WS)** | 1:1 connection with auto-reconnect + exponential backoff |
| UI Components | **Tamagui** | Cross-platform styled components, compilable to native |
| Theming | **Tamagui Themes** | Dark/Light mode with system preference detection |
| Image Handling | **expo-image** | High-performance image loading with caching |
| Camera | **expo-camera + expo-image-picker** | Photo capture and gallery selection |
| Push Notifications | **expo-notifications + FCM/APNs** | Cross-platform push notifications |
| Secure Storage | **expo-secure-store** | Keychain (iOS) / Keystore (Android) for tokens |
| Animations | **react-native-reanimated v3** | 60fps native animations on UI thread |
| Forms | **React Hook Form + Zod** | Performant forms with schema validation |
| Payments | **react-native-razorpay** | Razorpay SDK for Pro subscription |

### Infrastructure & DevOps
| Component | Technology | Why |
|-----------|-----------|-----|
| Containerization | **Docker + Docker Compose** | Reproducible builds, consistent environments |
| Orchestration | **Kubernetes (K8s)** | Auto-scaling, self-healing, rolling deployments |
| CI/CD | **GitHub Actions** | Automated testing, building, and deployment |
| Cloud | **AWS / DigitalOcean** | EC2/Droplets, RDS, ElastiCache, S3 |
| CDN | **CloudFlare** | Global edge caching, DDoS protection, WAF |
| SSL/TLS | **Let's Encrypt + CloudFlare** | Free TLS 1.3 certificates |
| Monitoring | **Prometheus + Grafana** | Metrics collection and visualization |
| Log Aggregation | **Loki + Grafana** | Centralized log management |
| Tracing | **Jaeger** | Distributed request tracing |
| Secrets | **HashiCorp Vault / AWS Secrets Manager** | Secure secrets management |

### Database Architecture
| Database | Role | Configuration |
|----------|------|---------------|
| **PostgreSQL 16** | Primary data store | 1 Primary + 2 Read Replicas, pgBouncer connection pooling |
| **Redis 7** | Cache + Sessions + PubSub + Rate Limiting | Redis Cluster (6 nodes), AOF persistence |
| **S3/R2** | Media storage (images, generated outfits) | CloudFlare R2 (S3-compatible, no egress fees) |

---

## 4. Data Architecture

### Entity-Relationship Diagram

```
┌──────────────┐       ┌───────────────┐       ┌──────────────────┐
│    users     │       │  user_profiles │       │  subscriptions   │
├──────────────┤       ├───────────────┤       ├──────────────────┤
│ id (UUID) PK │──────▶│ user_id FK    │       │ id (UUID) PK     │
│ email        │       │ display_name  │       │ user_id FK       │
│ password_hash│       │ avatar_url    │       │ plan_type        │
│ role (enum)  │       │ gender        │       │ status           │
│ is_verified  │       │ body_type     │       │ price_inr        │
│ is_active    │       │ style_prefs   │       │ razorpay_sub_id  │
│ created_at   │       │ color_prefs   │       │ starts_at        │
│ updated_at   │       │ updated_at    │       │ expires_at       │
└──────────────┘       └───────────────┘       └──────────────────┘
       │                                               │
       │                                               │
       ▼                                               ▼
┌──────────────────┐   ┌───────────────────┐   ┌──────────────────┐
│ wardrobe_items   │   │ outfit_generations│   │ payments         │
├──────────────────┤   ├───────────────────┤   ├──────────────────┤
│ id (UUID) PK     │   │ id (UUID) PK      │   │ id (UUID) PK     │
│ user_id FK       │   │ user_id FK        │   │ subscription_id  │
│ image_url        │   │ prompt_text       │   │ razorpay_payment │
│ category (enum)  │   │ input_image_urls  │   │ amount_inr       │
│ color            │   │ output_image_url  │   │ status           │
│ brand            │   │ style_score       │   │ method           │
│ occasion_tags    │   │ occasion          │   │ created_at       │
│ season           │   │ ai_feedback       │   └──────────────────┘
│ metadata (JSONB) │   │ model_version     │
│ created_at       │   │ latency_ms        │   ┌──────────────────┐
└──────────────────┘   │ tokens_used       │   │ admin_config     │
                       │ created_at        │   ├──────────────────┤
┌──────────────────┐   └───────────────────┘   │ key (PK)         │
│ notifications    │                           │ value (JSONB)    │
├──────────────────┤   ┌───────────────────┐   │ updated_at       │
│ id (UUID) PK     │   │ user_sessions     │   │ updated_by       │
│ user_id FK       │   ├───────────────────┤   └──────────────────┘
│ title            │   │ id (UUID) PK      │
│ body             │   │ user_id FK        │
│ type (enum)      │   │ device_id         │
│ is_read          │   │ fcm_token         │
│ data (JSONB)     │   │ platform (enum)   │
│ created_at       │   │ app_version       │
└──────────────────┘   │ last_active_at    │
                       │ created_at        │
                       └───────────────────┘
```

### Redis Data Structures
```
# Session Cache (Hash)
session:{user_id} → { token, device_id, last_active, ip }  TTL: 24h

# Rate Limiting (Sorted Set)
ratelimit:ai:{user_id} → sorted set of timestamps  TTL: 24h

# WebSocket Registry (Hash)  
ws:connections → { user_id: server_instance_id }

# AI Generation Queue (Stream)
stream:ai_tasks → { user_id, prompt, image_urls, priority }

# User Cache (String with JSON)
cache:user:{user_id} → serialized user data  TTL: 15min

# Pro Price Config (String)
config:pro_price_inr → "299"  (no TTL, admin-managed)

# Pub/Sub Channels
channel:notifications:{user_id}
channel:admin:broadcast
```

---

## 5. API Design

### REST API Endpoints

```
BASE URL: https://api.dressly.app/v1

── Authentication ──────────────────────────────────────────
POST   /auth/register          Register new user
POST   /auth/login             Login (returns JWT pair)
POST   /auth/refresh           Refresh access token
POST   /auth/logout            Invalidate session
POST   /auth/forgot-password   Send reset email
POST   /auth/reset-password    Reset with token
POST   /auth/verify-email      Verify email with OTP

── User ────────────────────────────────────────────────────
GET    /users/me               Get current user profile
PATCH  /users/me               Update profile
PATCH  /users/me/preferences   Update style preferences
DELETE /users/me               Soft delete account
POST   /users/me/avatar        Upload avatar

── Wardrobe ────────────────────────────────────────────────
GET    /wardrobe               List wardrobe items (paginated)
POST   /wardrobe               Add item (upload image)
GET    /wardrobe/:id           Get item details
PATCH  /wardrobe/:id           Update item metadata
DELETE /wardrobe/:id           Remove item

── AI Outfit Generation ────────────────────────────────────
POST   /ai/generate            Generate outfit (text + images → image)
GET    /ai/generations         List past generations (paginated)
GET    /ai/generations/:id     Get generation details
POST   /ai/analyze             Analyze dress code from photo
GET    /ai/quota               Check remaining daily quota

── Subscription ────────────────────────────────────────────
GET    /subscription           Get current subscription
POST   /subscription/checkout  Create Razorpay order
POST   /subscription/verify    Verify payment & activate
POST   /subscription/cancel    Cancel subscription

── Notifications ───────────────────────────────────────────
GET    /notifications          List notifications (paginated)
PATCH  /notifications/:id/read Mark as read
POST   /notifications/token    Register FCM token

── Admin (Protected) ───────────────────────────────────────
GET    /admin/users            List all users (paginated)
PATCH  /admin/users/:id        Update user (ban, change role)
GET    /admin/config           Get all config
PATCH  /admin/config           Update config (pro price, etc.)
GET    /admin/analytics        Dashboard analytics
GET    /admin/subscriptions    List all subscriptions
```

### WebSocket Protocol

```
Connection: wss://api.dressly.app/ws?token={jwt_access_token}

── Client → Server Messages ──
{ "type": "ping" }
{ "type": "subscribe", "channel": "notifications" }
{ "type": "ai_progress", "generation_id": "uuid" }

── Server → Client Messages ──
{ "type": "pong", "server_time": 1708905600 }
{ "type": "notification", "data": { ... } }
{ "type": "ai_progress", "generation_id": "uuid", "status": "processing", "progress": 45 }
{ "type": "ai_complete", "generation_id": "uuid", "result": { ... } }
{ "type": "subscription_updated", "data": { ... } }
{ "type": "config_updated", "key": "pro_price_inr", "value": "299" }
```

---

## 6. Real-Time Communication

### WebSocket Architecture (1 User = 1 Connection)

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Manager                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  DashMap<UserId, Addr<WsSession>>                   │    │
│  │  (Lock-free concurrent HashMap)                      │    │
│  │                                                     │    │
│  │  User_A ──▶ WsSession(Actor) ──▶ TcpStream          │    │
│  │  User_B ──▶ WsSession(Actor) ──▶ TcpStream          │    │
│  │  User_C ──▶ WsSession(Actor) ──▶ TcpStream          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Features:                                                  │
│  • Heartbeat: Ping every 10s, timeout after 30s             │
│  • Auto-reconnect: Client-side exponential backoff          │
│  • Message queue: Buffer messages during reconnection       │
│  • Compression: permessage-deflate for bandwidth savings    │
│  • Auth: JWT validated on connection handshake               │
│  • Rate limit: Max 100 messages/minute per connection       │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Server WebSocket Scaling
```
Server_1 (WS connections: User_A, User_B)
    │
    ├── Redis PubSub ──▶ channel:user:{user_id}
    │
Server_2 (WS connections: User_C, User_D)
    │
    └── Redis PubSub ──▶ channel:user:{user_id}

When sending notification to User_C from Server_1:
1. Server_1 publishes to Redis channel:user:User_C
2. Server_2 (subscribed) receives and forwards to User_C's WsSession
```

---

## 7. AI/ML Pipeline — Gemini Integration

### Outfit Generation Flow

```
User Request                    Processing Pipeline
─────────────                   ──────────────────
Text Prompt ──┐
              ├──▶ Validation ──▶ Rate Check ──▶ Queue (Redis Stream)
Image 1 ──────┤                                       │
Image 2 ──────┤                                       ▼
Image 3 ──────┘                              ┌─────────────────┐
                                             │ AI Worker Pool   │
                                             │ (Tokio Tasks)    │
                                             │                 │
                                             │ 1. Pre-process  │
                                             │    images       │
                                             │ 2. Build Gemini │
                                             │    prompt       │
                                             │ 3. Call API     │
                                             │ 4. Post-process │
                                             │ 5. Store result │
                                             │ 6. Notify user  │
                                             └─────────────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ Generated Outfit │
                                             │ + Style Score    │
                                             │ + AI Feedback    │
                                             └─────────────────┘
```

### Gemini API Integration
- **Model:** `gemini-2.0-flash` (multimodal: text + images → text/image)
- **Input:** User text prompt + up to 4 clothing images
- **Output:** AI-generated outfit recommendation with style analysis
- **Rate Limits:** Free users: 5/day, Pro users: unlimited
- **Fallback:** Queue-based processing with circuit breaker (3 failures → open)
- **Caching:** Cache identical prompts for 1 hour (content-hash based)

---

## 8. Authentication & Authorization

### Auth Flow
```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌─────────┐
│  Client  │────▶│ API Layer │────▶│ Auth Svc │────▶│ DB/Redis│
└──────────┘     └───────────┘     └──────────┘     └─────────┘

Registration:
1. Client sends email + password
2. Password hashed with Argon2id (memory: 64MB, iterations: 3, parallelism: 4)
3. User created in PostgreSQL
4. Verification OTP sent via email
5. Return JWT pair (access: 15min, refresh: 7days)

Login:
1. Client sends email + password
2. Argon2id verify against stored hash
3. Generate JWT pair
4. Store session in Redis (device_id, ip, user_agent)
5. Return tokens

Token Refresh:
1. Client sends refresh token
2. Validate refresh token signature + expiry
3. Check session exists in Redis
4. Rotate: new access token + new refresh token
5. Invalidate old refresh token
```

### Role-Based Access Control (RBAC)
```
Roles: User, Pro, Admin

User  → Basic features, limited AI quota
Pro   → Unlimited AI, premium features, priority queue
Admin → Full access, user management, config management, analytics
```

---

## 9. Payment Gateway

### Razorpay Integration Flow
```
┌────────┐  1. Checkout   ┌────────┐  2. Create Order  ┌──────────┐
│ Client │───────────────▶│ Server │──────────────────▶│ Razorpay │
│        │                │        │◀──────────────────│          │
│        │◀───────────────│        │  3. Order ID       │          │
│        │  4. Order ID   │        │                    │          │
│        │                │        │                    │          │
│        │─── 5. Pay ─────────────────────────────────▶│          │
│        │◀── 6. Success ─────────────────────────────│          │
│        │                │        │                    │          │
│        │  7. Verify     │        │  8. Verify Sig     │          │
│        │───────────────▶│        │──────────────────▶│          │
│        │                │        │◀──────────────────│          │
│        │◀───────────────│        │  9. Confirmed      │          │
│        │ 10. Activated  │        │                    │          │
└────────┘                └────────┘                    └──────────┘
```

### Webhook Handling
- Razorpay sends webhooks for subscription events
- Signature verification using HMAC-SHA256
- Idempotent processing (store webhook ID, skip duplicates)
- Events: `payment.captured`, `subscription.activated`, `subscription.cancelled`

---

## 10. Notification System

### Push Notification Architecture
```
┌─────────────┐     ┌──────────┐     ┌─────────────┐
│ Trigger      │────▶│ Notif    │────▶│ FCM/APNs   │
│ (AI done,   │     │ Service  │     │ Gateway    │
│  payment,   │     │          │     │            │
│  admin msg) │     │ ┌──────┐ │     │ ┌────────┐ │
└─────────────┘     │ │Queue │ │     │ │Firebase│ │
                    │ │Redis │ │────▶│ │  FCM   │ │──▶ Android
                    │ │Stream│ │     │ └────────┘ │
                    │ └──────┘ │     │ ┌────────┐ │
                    │          │     │ │  APNs  │ │──▶ iOS
                    └──────────┘     │ └────────┘ │
                                     └─────────────┘
```

### Notification Types
- `ai_generation_complete` — AI outfit ready
- `subscription_activated` — Pro plan activated
- `subscription_expiring` — Pro plan expiring soon
- `admin_announcement` — Broadcast from admin
- `style_tip` — Daily style tip (engagement)

---

## 11. Security Architecture

### Defense-in-Depth Layers

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **Network** | DDoS, WAF | CloudFlare (L3/L4/L7 protection) |
| **Transport** | Encryption | TLS 1.3, HSTS, Certificate Pinning |
| **Application** | Input Validation | Serde + Validator (compile-time) |
| **Authentication** | Identity | JWT (RS256) + Argon2id + MFA-ready |
| **Authorization** | Access Control | RBAC middleware, resource ownership |
| **Data** | Encryption at Rest | AES-256-GCM for PII, pgcrypto |
| **API** | Rate Limiting | Token bucket (100 req/min/user) |
| **Secrets** | Key Management | Vault / env-based with rotation |
| **Dependencies** | Supply Chain | cargo-audit, dependabot |

### OWASP Top 10 Mitigations
- **Injection:** Parameterized queries via SQLx (compile-time checked)
- **Broken Auth:** Argon2id, JWT rotation, session management in Redis
- **XSS:** React Native (no DOM), server-side output encoding
- **CSRF:** Token-based API (no cookies for auth)
- **SSRF:** URL allowlist for external API calls
- **Security Logging:** All auth events logged with IP, UA, timestamp

---

## 12. Scalability & Performance

### Target: 1-3 Million Concurrent Users

#### Horizontal Scaling Strategy
```
Load Balancer (Nginx/HAProxy)
    │
    ├── API Server Pod 1  (8 cores, 16GB RAM) ─── handles ~50K connections
    ├── API Server Pod 2  (8 cores, 16GB RAM) ─── handles ~50K connections
    ├── ...
    └── API Server Pod N  (auto-scaled by K8s HPA)

PostgreSQL:
    ├── Primary (writes) ─── 32 cores, 128GB RAM, NVMe SSD
    ├── Read Replica 1 ──── read queries load-balanced
    └── Read Replica 2 ──── read queries load-balanced

Redis Cluster:
    ├── Node 1 (master) + Node 2 (replica)
    ├── Node 3 (master) + Node 4 (replica)
    └── Node 5 (master) + Node 6 (replica)
```

#### Performance Optimizations
| Optimization | Expected Impact |
|-------------|----------------|
| Rust zero-copy deserialization | ~2x faster request parsing |
| SQLx connection pooling (pgBouncer) | 10K+ concurrent DB connections |
| Redis caching (user data, config) | 95%+ cache hit rate |
| SIMD JSON parsing (simd-json) | 2-4x faster serialization |
| Tokio work-stealing scheduler | Optimal CPU utilization |
| Connection: keep-alive | Reduce TCP handshake overhead |
| gzip/brotli compression | 60-80% bandwidth reduction |
| Image CDN with WebP/AVIF | 50% smaller images |
| Database query optimization | B-tree indexes on hot paths |
| Prepared statements | Eliminate query parsing overhead |

#### Benchmarks (Expected on 8-core server)
| Metric | Target |
|--------|--------|
| REST API latency (p50) | < 5ms |
| REST API latency (p99) | < 50ms |
| WebSocket message latency | < 2ms |
| Requests/second per server | 100,000+ |
| WebSocket connections per server | 50,000+ |
| AI generation queue throughput | 1,000/min |

---

## 13. Deployment Architecture

### Production Environment
```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                     │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │  dressly-api    │  │  dressly-api    │               │
│  │  (Deployment)   │  │  (Deployment)   │  Auto-scaled  │
│  │  replicas: 3-20 │  │  replicas: 3-20 │  by HPA       │
│  └────────┬────────┘  └────────┬────────┘               │
│           │                    │                         │
│  ┌────────┴────────────────────┴────────┐               │
│  │         Service (ClusterIP)          │               │
│  └──────────────────┬───────────────────┘               │
│                     │                                   │
│  ┌──────────────────┴───────────────────┐               │
│  │         Ingress (Nginx)              │               │
│  │         TLS Termination              │               │
│  └──────────────────────────────────────┘               │
│                                                         │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐      │
│  │ PostgreSQL  │  │  Redis   │  │  Prometheus    │      │
│  │ (StatefulSet)│ │ (Cluster)│  │  + Grafana     │      │
│  └─────────────┘  └──────────┘  └────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline
```
Push to main ──▶ GitHub Actions ──▶ Lint + Test ──▶ Build Docker Image
                                                          │
                                    ┌─────────────────────┘
                                    ▼
                              Push to Registry ──▶ Deploy to K8s (Rolling Update)
                                                          │
                                    ┌─────────────────────┘
                                    ▼
                              Smoke Tests ──▶ Monitor ──▶ Rollback if needed
```

---

## 14. Monitoring & Observability

### Three Pillars
1. **Metrics:** Prometheus scrapes `/metrics` endpoint → Grafana dashboards
2. **Logs:** Structured JSON logs → Loki → Grafana log explorer
3. **Traces:** OpenTelemetry spans → Jaeger → request flow visualization

### Key Dashboards
- **API Health:** Request rate, error rate, latency percentiles
- **WebSocket:** Active connections, message rate, disconnections
- **Database:** Query latency, connection pool utilization, replication lag
- **AI Pipeline:** Generation queue depth, processing time, API errors
- **Business:** DAU, MAU, Pro conversions, revenue, churn rate

### Alerting Rules
| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | 5xx > 1% for 5min | Critical |
| High Latency | p99 > 500ms for 5min | Warning |
| DB Connection Pool | > 80% utilized | Warning |
| WebSocket Flood | > 1M connections | Critical |
| AI Queue Backlog | > 10,000 pending | Warning |
| Disk Usage | > 85% | Warning |

---

## 15. Data Structures & Algorithms

### Core Data Structures Used

| Data Structure | Usage | Complexity |
|---------------|-------|------------|
| **DashMap** (Concurrent HashMap) | WebSocket connection registry | O(1) avg lookup |
| **B-Tree Index** (PostgreSQL) | Database query optimization | O(log n) search |
| **Bloom Filter** | Email uniqueness pre-check | O(k) lookup, space-efficient |
| **Token Bucket** | Rate limiting algorithm | O(1) per request |
| **Priority Queue (BinaryHeap)** | AI task scheduling (Pro users first) | O(log n) insert/extract |
| **LRU Cache** | In-memory user data cache | O(1) get/put |
| **Trie** | Autocomplete for fashion tags | O(m) search (m = key length) |
| **Ring Buffer** | WebSocket message history | O(1) push, bounded memory |
| **Sorted Set (Redis)** | Leaderboard, rate limit windows | O(log n) operations |
| **Hash Ring** | Consistent hashing for WS routing | O(log n) server lookup |

### Algorithms Used

| Algorithm | Usage | Why |
|-----------|-------|-----|
| **Argon2id** | Password hashing | Memory-hard, resistant to GPU attacks |
| **HMAC-SHA256** | Webhook signature verification | Tamper-proof message authentication |
| **RS256 (RSA + SHA-256)** | JWT signing | Asymmetric, public key verification |
| **Exponential Backoff** | WebSocket reconnection, API retries | Prevents thundering herd |
| **Circuit Breaker** | External API resilience | Fail-fast, auto-recovery |
| **Sliding Window** | Rate limiting | Smooth rate enforcement |
| **Content-Based Hashing** | Image deduplication | Avoid duplicate storage |
| **Work-Stealing** | Tokio task scheduling | Optimal multi-core utilization |
| **Consistent Hashing** | WebSocket server routing | Minimal disruption on scale |

---

## 16. Folder Structure

See the actual project implementation for the complete folder structure.

---

## 17. Testing Strategy

### Testing Pyramid
```
          ╱  E2E Tests  ╲           (~100 tests)
         ╱   (Cypress)    ╲
        ╱──────────────────╲
       ╱ Integration Tests  ╲       (~500 tests)
      ╱  (API, DB, WebSocket) ╲
     ╱────────────────────────╲
    ╱     Unit Tests           ╲    (~4400+ tests)
   ╱  (Functions, Models, Utils)╲
  ╱────────────────────────────────╲

  Total: 5000+ test cases
```

### Test Categories
| Category | Count | Tools |
|----------|-------|-------|
| Rust Unit Tests | 2000+ | `cargo test`, `mockall` |
| Rust Integration Tests | 500+ | `actix-rt`, test DB |
| Rust Property Tests | 500+ | `proptest`, `quickcheck` |
| Rust Benchmark Tests | 100+ | `criterion` |
| React Native Unit Tests | 1500+ | `jest`, `@testing-library/react-native` |
| React Native Component Tests | 300+ | `jest`, snapshot testing |
| E2E Tests | 100+ | `detox` (iOS/Android) |

---

## 18. Cost Estimation (Monthly, at Scale)

| Resource | Specification | Est. Cost |
|----------|--------------|-----------|
| 4x API Servers | 8 vCPU, 16GB RAM | ₹40,000 |
| PostgreSQL (Primary) | 16 vCPU, 64GB RAM | ₹25,000 |
| PostgreSQL (2 Replicas) | 8 vCPU, 32GB RAM each | ₹30,000 |
| Redis Cluster (6 nodes) | 4 vCPU, 16GB RAM each | ₹36,000 |
| CloudFlare R2 Storage | 1TB | ₹1,200 |
| CloudFlare CDN + WAF | Pro Plan | ₹1,500 |
| Google Gemini API | ~100K requests/day | ₹15,000 |
| FCM (Notifications) | Free tier | ₹0 |
| Monitoring Stack | Grafana Cloud | ₹5,000 |
| **Total** | | **~₹1,53,700/month** |

---

*This document is a living specification. Update as architecture evolves.*