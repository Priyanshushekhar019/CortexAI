# CortexAI — Intelligent Multi-Agent AI Platform & Microservices Ecosystem

[![GitHub Workflow Status](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue?logo=github-actions)](https://github.com/Priyanshushekhar019/CortexAI/actions)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Containers-Docker%20%7C%20Docker%20Compose-2496ED?logo=docker)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/Cloud-AWS%20ECS%20%7C%20ECR%20%7C%20S3%20%7C%20CloudFront-FF9900?logo=amazon-aws)](https://aws.amazon.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Redis-47A248?logo=mongodb)](https://www.mongodb.com/)

**CortexAI** is a cloud-native, enterprise-grade multi-agent artificial intelligence platform. It features multi-model LLM chat orchestration, full-duplex conversational voice mode, retrieval-augmented generation (RAG) document analysis, interactive code canvas artifacts, and full billing integration powered by a scalable microservices architecture.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Microservices Ecosystem](#-microservices-ecosystem)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started Locally](#-getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running via Docker Compose](#running-via-docker-compose)
  - [Running Manually](#running-manually)
- [Cloud Deployment & CI/CD](#-cloud-deployment--cicd)
- [Contributing & License](#-license)

---

## 🏛 Architecture Overview

CortexAI is designed with distributed cloud principles, separating concerns across a high-performance API Gateway, independent domain microservices, resilient Redis caching, and an AWS CloudFront CDN frontend:

```
                            [ Web Browser / Client ]
                                        │
                         HTTPS Request / CDN Static Assets
                                        ▼
                           ┌─────────────────────────┐
                           │   AWS CloudFront + S3   │  (Frontend React SPA)
                           └────────────┬────────────┘
                                        │ API Requests
                                        ▼
                           ┌─────────────────────────┐
                           │    Cortex API Gateway   │  (Port 8000)
                           │   (Reverse Proxy / CORS │
                           │    Redis Rate Limiting) │
                           └────────────┬────────────┘
                                        │
         ┌──────────────┬───────────────┼───────────────┬──────────────┐
         ▼              ▼               ▼               ▼              ▼
   ┌───────────┐  ┌───────────┐   ┌───────────┐   ┌───────────┐  ┌───────────┐
   │   Auth    │  │   Chat    │   │   Agent   │   │  Billing  │  │   Redis   │
   │  Service  │  │  Service  │   │  Service  │   │  Service  │  │   Cache   │
   │ (Pt 8001) │  │ (Pt 8002) │   │ (Pt 8003) │   │ (Pt 8004) │  │ (Pt 6379) │
   └─────┬─────┘  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘  └───────────┘
         │              │               │               │
         ▼              ▼               ▼               ▼
    [Firebase]      [MongoDB]      [OpenRouter]     [Razorpay]
                                   [ AWS S3 RAG ]
```

---

## ✨ Key Features

- 🧠 **Multi-Agent Orchestration:** Specialized agents for general queries, multi-agent swarms, RAG file analysis, and code synthesis.
- 🎙️ **Full-Duplex Live Voice Assistant:** Hands-free voice interface using native Web Speech recognition and Web Speech synthesis with conversational auto-looping.
- 🎨 **Interactive Artifact Canvas:** Live side-by-side execution and preview of generated code (HTML/JS, React, SVG, and Mermaid diagrams).
- 📄 **PDF & Document RAG:** Upload PDFs and documents stored securely in AWS S3 with intelligent context chunking and semantic query retrieval.
- ⚡ **Redis Token Bucket Rate Limiting:** Enforces fair-use API quotas across free and paid tier limits.
- 💳 **Subscription & Billing System:** Integrated Razorpay checkout with webhook verification for instant plan upgrades.
- 🚢 **Automated CI/CD Pipeline:** GitHub Actions workflow building Docker containers for AWS ECR, triggering rolling updates to AWS ECS, and syncing frontend bundles to AWS S3 & CloudFront.

---

## 🧩 Microservices Ecosystem

| Service | Port | Description | Integrations |
|---|---|---|---|
| **Gateway** | `8000` | Unified entry point, request proxying, cookie parsing, Redis rate limiter | Express, ioredis, express-http-proxy |
| **Auth** | `8001` | User registration, login, session tokens, profile updates | Firebase Admin SDK, MongoDB, JWT |
| **Chat** | `8002` | Conversation threads, message persistence, history retrieval | MongoDB, Mongoose |
| **Agent** | `8003` | OpenRouter model queries, LangChain processing, S3 PDF RAG embeddings | OpenRouter, AWS S3, LangChain |
| **Billing** | `8004` | Plan subscriptions, Razorpay order generation, webhook verification | Razorpay API, crypto |

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS, Lucide React
- **State Management:** Redux Toolkit
- **Diagrams & Visuals:** Mermaid.js, Rough.js, Cytoscape, Katex

### Backend
- **Runtime:** Node.js (ES Modules, Node 20)
- **Framework:** Express.js
- **Cache & Rate Limiting:** Redis / AWS ElastiCache via `ioredis`
- **Database:** MongoDB Atlas
- **Authentication:** Firebase Admin SDK, JSON Web Tokens

### Cloud & Infrastructure
- **Containerization:** Docker & Docker Compose
- **Container Registry:** AWS ECR
- **Compute:** AWS ECS (Elastic Container Service)
- **Storage & CDN:** AWS S3, AWS CloudFront
- **CI/CD:** GitHub Actions

---

## 📁 Project Directory Structure

```text
CortexAI/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline for ECS & S3
├── 1.cortexAI/
│   ├── backend/
│   │   ├── docker-compose.yml    # Local multi-service orchestration
│   │   ├── gateway/              # API Gateway service
│   │   ├── services/
│   │   │   ├── auth/             # Authentication & user management
│   │   │   ├── chat/             # Conversation history service
│   │   │   ├── agent/            # LLM & RAG agent service
│   │   │   └── billing/          # Razorpay subscription service
│   │   └── shared/               # Shared Redis & utility packages
│   └── frontend/                 # React + Vite client application
├── package.json
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

---

### Environment Configuration

Create a `.env` file in each respective directory with your credentials:

#### 1. `1.cortexAI/backend/gateway/.env`
```env
PORT=8000
AUTH_SERVICE=http://localhost:8001
CHAT_SERVICE=http://localhost:8002
AGENT_SERVICE=http://localhost:8003
BILLING_SERVICE=http://localhost:8004
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

#### 2. `1.cortexAI/backend/services/auth/.env`
```env
PORT=8001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```

#### 3. `1.cortexAI/backend/services/chat/.env`
```env
PORT=8002
MONGODB_URI=your_mongodb_connection_string
```

#### 4. `1.cortexAI/backend/services/agent/.env`
```env
PORT=8003
OPENROUTER_API_KEY=your_openrouter_api_key
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_s3_bucket
```

#### 5. `1.cortexAI/backend/services/billing/.env`
```env
PORT=8004
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### 6. `1.cortexAI/frontend/.env`
```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_SERVER_URL=http://localhost:8000
```

---

### Running via Docker Compose

Run all backend microservices and Redis with a single command:

```bash
cd 1.cortexAI/backend
docker compose up --build
```

In a separate terminal, launch the frontend:

```bash
cd 1.cortexAI/frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

### Running Manually

1. **Start Redis:**
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Start Backend Services:**
   ```bash
   # Terminal 1 - Gateway
   cd 1.cortexAI/backend/gateway && npm install && npm start

   # Terminal 2 - Auth
   cd 1.cortexAI/backend/services/auth && npm install && npm start

   # Terminal 3 - Chat
   cd 1.cortexAI/backend/services/chat && npm install && npm start

   # Terminal 4 - Agent
   cd 1.cortexAI/backend/services/agent && npm install && npm start

   # Terminal 5 - Billing
   cd 1.cortexAI/backend/services/billing && npm install && npm start
   ```

3. **Start Frontend:**
   ```bash
   cd 1.cortexAI/frontend
   npm install
   npm run dev
   ```

---

## ☁️ Cloud Deployment & CI/CD

Deployment is automated via **GitHub Actions** (`.github/workflows/deploy.yml`):

1. **Trigger:** On push to branch `main`.
2. **Backend Pipeline:**
   - Authenticates with AWS IAM via `aws-actions/configure-aws-credentials`.
   - Logs into AWS ECR.
   - Builds optimized `node:20-slim` images for each service (`gateway`, `auth`, `chat`, `agent`, `billing`).
   - Pushes tags to AWS ECR.
   - Issues `aws ecs update-service --force-new-deployment` to deploy zero-downtime rolling container updates.
3. **Frontend Pipeline:**
   - Compiles production Vite assets (`npm run build`).
   - Syncs `dist/` directly to AWS S3.
   - Creates a CloudFront cache invalidation (`aws cloudfront create-invalidation --paths "/*"`) for instant global delivery.

---

## 📜 License

This project is licensed under the MIT License.
