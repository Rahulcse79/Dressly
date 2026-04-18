<p align="center">
  <h1 align="center">🎨 DRESSLY</h1>
  <p align="center">
    <strong>AI-Powered Fashion Advisory Platform</strong>
  </p>
  <p align="center">
    <em>Upload your wardrobe. Get styled by AI. Dress with confidence.</em>
  </p>
  <p align="center">
    <a href="#features"><img src="https://img.shields.io/badge/AI-Gemini%202.0-blue?style=for-the-badge" alt="AI Powered"/></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Backend-Rust-orange?style=for-the-badge&logo=rust" alt="Rust"/></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Mobile-Flutter-02569B?style=for-the-badge&logo=flutter" alt="Flutter"/></a>
    <a href="#tech-stack"><img src="https://img.shields.io/badge/Web-React-61DAFB?style=for-the-badge&logo=react" alt="React"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"/></a>
  </p>
</p>

---

## 🧠 What is Dressly?

**Dressly** is a production-grade, AI-powered fashion advisory platform that helps users build smarter wardrobes and generate stunning outfit combinations. Powered by **Google Gemini 2.0 Flash** multimodal AI, users upload clothing images and receive AI-curated outfit recommendations complete with style scores, occasion matching, and personalized fashion advice.

Built to handle **1–3 million concurrent users** with a Rust backend delivering sub-5ms API latency.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Outfit Generation** | Text + multiple clothing images → AI-generated outfit with style score |
| 👔 **Occasion-Based Styling** | Outfits matched to events — formal, casual, party, wedding, interview |
| 🗄️ **Digital Wardrobe** | Upload and categorize your entire clothing collection |
| 📊 **Dress Code Analysis** | AI analyzes outfit photos and suggests improvements |
| 💎 **Pro Subscription** | Unlimited AI generations, premium features via Razorpay |
| 🔔 **Real-Time Notifications** | Push notifications via FCM/APNs for AI results, payments, tips |
| 🌐 **WebSocket Support** | 1:1 persistent connections with heartbeat and auto-reconnect |
| 🛡️ **Admin Dashboard** | User management, dynamic pricing, analytics, broadcast messaging |
| 🌙 **Dark/Light Mode** | System-aware theming across platforms |

---

## 🏗️ Architecture

```
Client (Flutter / React)
        │
        ▼  HTTPS / WSS (TLS 1.3)
   CloudFlare CDN + WAF
        │
        ▼
   Nginx Load Balancer
        │
        ▼
  ┌─────────────────────────────────┐
  │  Rust Backend (Actix-Web 4)     │
  │  ┌─────┬──────┬────────┬─────┐ │
  │  │Auth │ User │ AI/ML  │Pay  │ │
  │  │ Svc │ Svc  │ Svc    │ Svc │ │
  │  └─────┴──────┴────────┴─────┘ │
  │  WebSocket Manager (DashMap)    │
  │  Tokio Async Runtime            │
  └─────────────┬───────────────────┘
                │
    ┌───────────┼───────────┬──────────────┐
    ▼           ▼           ▼              ▼
PostgreSQL   Redis 7     S3/R2       Gemini API
 (Primary    (Cache +    (Media)     (Multimodal
 + Replicas)  PubSub)                  AI)
```

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Language | Rust 1.75+ |
| Framework | Actix-Web 4 |
| Async Runtime | Tokio |
| Database | PostgreSQL 16 + SQLx (compile-time checked) |
| Cache | Redis 7 (Cluster) |
| Auth | JWT (RS256) + Argon2id |
| AI | Google Gemini 2.0 Flash |
| Payments | Razorpay |
| Serialization | Serde + simd-json |
| Logging | tracing + tracing-subscriber |

### Mobile
| Component | Technology |
|-----------|-----------|
| Framework | Flutter 3.x |
| State Management | Riverpod |
| Navigation | GoRouter |
| HTTP Client | Dio |
| Secure Storage | flutter_secure_storage |
| Image Handling | cached_network_image |

### Web
| Component | Technology |
|-----------|-----------|
| Framework | React |
| Language | JavaScript |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containers | Docker + Docker Compose |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions + Codemagic |
| CDN + WAF | CloudFlare |
| Monitoring | Prometheus + Grafana |
| Tracing | Jaeger |

---

## 📂 Project Structure

```
Dressly/
├── backend/              # Rust API server (Actix-Web)
│   ├── src/
│   │   ├── api/          # Routes, handlers, middleware, responses
│   │   ├── config/       # App configuration
│   │   ├── db/           # Models, migrations, repositories
│   │   ├── errors/       # Error types
│   │   ├── services/     # Auth, AI, Payment, WebSocket, Notifications
│   │   ├── utils/        # Helpers
│   │   └── workers/      # Background job processors
│   ├── tests/            # Unit, integration, property-based tests
│   └── benches/          # Criterion benchmarks
│
├── mobile_flutter/       # Flutter cross-platform app (iOS + Android)
│   ├── lib/
│   │   ├── constants/    # App-wide constants
│   │   ├── models/       # Data models
│   │   ├── providers/    # Riverpod state management
│   │   ├── router/       # GoRouter navigation
│   │   ├── screens/      # UI screens
│   │   ├── services/     # API & WebSocket services
│   │   └── widgets/      # Reusable UI components
│   └── test/             # Widget & unit tests
│
├── web/                  # React web dashboard
│   └── src/
│       ├── components/   # UI components
│       ├── contexts/     # React contexts
│       ├── pages/        # Page views
│       └── services/     # API services
│
├── infra/                # Infrastructure configs
│   ├── k8s/              # Kubernetes manifests
│   └── prometheus.yml    # Monitoring config
│
├── docker-compose.yml    # Local development stack
├── codemagic.yaml        # Mobile CI/CD pipeline
├── SYSTEM_DESIGN.md      # Full system design document
└── LICENSE               # MIT License
```

---

## 🚀 Getting Started

### Prerequisites

- **Rust** 1.75+ — [Install](https://rustup.rs/)
- **Flutter** 3.x — [Install](https://docs.flutter.dev/get-started/install)
- **Docker** & **Docker Compose** — [Install](https://docs.docker.com/get-docker/)
- **Node.js** 18+ — [Install](https://nodejs.org/)

### 1. Clone the repository

```bash
git clone https://github.com/RahulSingh/Dressly.git
cd Dressly
```

### 2. Start infrastructure (PostgreSQL + Redis)

```bash
docker-compose up -d postgres redis
```

### 3. Run the backend

```bash
cd backend
cp .env.example .env    # configure your environment variables
cargo run --release
```

The API will be available at `http://localhost:8080`.

### 4. Run the Flutter app

```bash
cd mobile_flutter
flutter pub get
flutter run
```

### 5. Run the web dashboard

```bash
cd web
npm install
npm start
```

---

## 🧪 Testing

### Backend

```bash
cd backend

# Unit + integration tests
cargo test

# Property-based tests
cargo test --test test_proptest

# Benchmarks
cargo bench
```

### Mobile

```bash
cd mobile_flutter
flutter test
```

### Web

```bash
cd web
npm test
```

---

## ⚡ Performance Targets

| Metric | Target |
|--------|--------|
| REST API latency (p50) | < 5ms |
| REST API latency (p99) | < 50ms |
| WebSocket message latency | < 2ms |
| Requests/sec per node | 100,000+ |
| WebSocket connections per node | 50,000+ |
| AI generation throughput | 1,000/min |

---

## 🔒 Security

- **OWASP Top 10** mitigations baked in
- Compile-time SQL injection prevention via SQLx
- Argon2id password hashing (memory-hard)
- JWT with RS256 signing + token rotation
- TLS 1.3 everywhere, HSTS enabled
- Rate limiting (token bucket — 100 req/min/user)
- CloudFlare WAF + DDoS protection
- AES-256-GCM encryption for PII at rest
- All auth events logged with IP + user agent

---

## 💰 Business Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 5 AI generations/day, basic wardrobe, limited styles |
| **Pro** | Admin-controlled | Unlimited AI, advanced features, priority support |

---

## 📖 Documentation

- [**System Design Document**](SYSTEM_DESIGN.md) — Full architecture, data models, API design, scaling strategy

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Rahul Singh**

---

<p align="center">
  <sub>Built with ❤️ using Rust, Flutter, React, and Gemini AI</sub>
</p>
