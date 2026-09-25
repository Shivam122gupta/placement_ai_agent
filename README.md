# AI Placement Agent 🚀
### Autonomous Career & Placement Copilot for Students, Fresh Graduates & Early-Career Engineers

[![CI Tests](https://img.shields.io/badge/pytest-42%20passed-emerald.svg)](backend/tests)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.13-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC2626.svg?logo=qdrant&logoColor=white)](https://qdrant.tech)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2B%20Beanie-47A248.svg?logo=mongodb&logoColor=white)](https://mongodb.com)

---

## 🌟 Overview

**AI Placement Agent** is not a simple chatbot wrapper. It is a full-stack, enterprise-grade, autonomous career engineering platform designed to bridge the gap between candidate qualifications and technical industry requirements.

Powered by **autonomous ReAct planning agents**, **Qdrant vector semantic memory**, **zero-hallucination grounded matching**, **adaptive study roadmaps**, and **real-time 3-pillar mock interview simulators**, the system guides candidates through the complete career lifecycle from resume parsing to offer letter acceptance.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             React 18 + Vite Frontend                        │
│   (Tailwind CSS • Lucide Icons • Context API • Live Agent Telemetry)        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST / JWT Auth
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                              FastAPI Backend Core                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                         Agent Orchestrator                              │ │
│ │  - Autonomous ReAct Planning Loop                                       │ │
│ │  - Typed Tool Registry (Search, Match, Roadmap, RAG, Interview, Apply)  │ │
│ │  - Loop Breakers & Max Step Limits (10 steps)                           │ │
│ │  - Human-in-the-Loop (HITL) Application Confirmation Barrier            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────┬──────────────────────────┬───────────────────────┐ │
│ │  Resume Intelligence │   Job Intelligence       │ Grounded Matching     │ │
│ │  - Sandboxed Storage │   - SHA-256 Dedup        │ - 50% Skill Taxonomy  │ │
│ │  - PyPDF / Docx      │   - Multi-Source Ingest  │ - 25% Experience Yrs  │ │
│ │  - LLM Schema Sync   │   - JD Decomposer        │ - 25% Grounded Reason │ │
│ └──────────────────────┴──────────────────────────┴───────────────────────┘ │
│ ┌──────────────────────┬──────────────────────────┬───────────────────────┐ │
│ │  Candidate Memory    │  Mock Interview Arena    │ Application Tracker   │ │
│ │  - Section Chunker   │  - Dynamic 5-Question Gen│ - 8-Stage Lifecycle   │ │
│ │  - 384-d Cosine RAG  │  - 3-Pillar Rubric Eval  │ - Duplicate Guardrail │ │
│ │  - Tenant Isolation  │  - STAR Analysis         │ - In-App Notification │ │
│ └──────────────────────┴──────────────────────────┴───────────────────────┘ │
└──────────────────┬──────────────────────────────────────────┬───────────────┘
                   │                                          │
┌──────────────────▼───────────────────┐    ┌─────────────────▼───────────────┐
│     Qdrant Vector Database           │    │     MongoDB Atlas + Beanie ODM  │
│  - Candidate Resumes & Projects      │    │  - Users, Profiles, Resumes     │
│  - Multi-Tenant Isolated Namespaces  │    │  - Jobs, Matches, Applications  │
│  - Sub-150ms Vector Retrieval        │    │  - Mock Interviews, Notifications│
└──────────────────────────────────────┘    └─────────────────────────────────┘
```

---

## ✨ Key Capabilities & Modules

| Module | Features & Guarantees |
|---|---|
| **Landing Page** | High-converting hero showcase, live ReAct terminal simulation, interactive 7-step journey, architecture highlights, and instant authentication CTAs. |
| **1. Foundation & Auth** | Secure bcrypt hashing, JWT access/refresh token rotation, centralized error formats, and validated candidate profile sub-resources. |
| **2. Resume Intelligence** | Sandboxed PDF & Docx extraction, deep LLM structured parsing into typed schemas, and one-click profile synchronizers. |
| **3. Job Intelligence** | SHA-256 deduplicated ingestion, custom job description analyzer, and required vs preferred qualification breakdown. |
| **4. Grounded Matching** | 3-Dimensional hybrid match scoring (50% skill taxonomy overlap + 25% experience alignment + 25% grounded reasoning) with 1-Week, 2-Week, and 1-Month adaptive study roadmaps. **Strict zero-fabrication guarantee**. |
| **5. Autonomous Copilot** | Autonomous ReAct agent with strongly-typed tools, scratchpad reasoning, loop breakers, and **Human-in-the-Loop confirmation barriers** before critical actions. |
| **6. Qdrant Semantic Memory** | User-isolated vector embeddings (384-dimensional cosine metric), section-aware chunking, and sub-millisecond factual RAG retrieval. |
| **7. Mock Interview Simulator** | 5-question grounded interview generation across Technical, Deep Dive, System Design, and Behavioral formats with real-time 3-pillar rubric evaluations (Technical Accuracy, Depth, STAR Structure). |
| **8. Application Tracker** | Full 8-stage lifecycle tracker (`SAVED` → `APPLIED` → `SCREENING` → `INTERVIEWING` → `TECHNICAL` → `FINAL_ROUND` → `OFFER` / `REJECTED`) with Kanban Board, Data Table views, duplicate prevention, and real-time in-app notifications. |

---

## 🛠️ Technology Stack

- **Backend:** Python 3.11+, FastAPI, Pydantic v2, Motor, Beanie ODM, PyPDF, python-docx, PyJWT, Passlib, Loguru
- **LLM & Inference:** Groq API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`), fallback mock providers
- **Vector Database:** Qdrant Cloud / Local Vector Engine (384-d Cosine Metric)
- **Primary Database:** MongoDB Atlas / Local MongoDB
- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, Lucide React, Axios
- **Testing:** PyTest, PyTest-Asyncio, HTTPX TestClient (42/42 Unit & Integration Tests Passing)

---

## ⚡ Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- MongoDB Atlas cluster or local MongoDB instance
- Qdrant Cloud cluster or local Qdrant instance
- Groq API Key

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example .env
# Edit .env with your MongoDB, Qdrant, and Groq credentials
```

#### Run Database Seeding:
```bash
python -m scripts.seed_database
```

#### Start FastAPI Server:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: **http://127.0.0.1:8000/docs**

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```
Frontend Web App will be live at: **http://localhost:5173**

---

### 3. Run Test Suite

```bash
cd backend
pytest tests -v
```
All 42 integration and unit tests will run and validate authentication, resume extraction, job deduplication, hybrid matching, agent reasoning, vector memory isolation, interview rubrics, and application tracker lifecycles.

---

## 🔐 Environment Variables (`.env.example`)

```env
# App Configuration
APP_ENV=development
DEBUG=true
SECRET_KEY=change_this_in_production_to_a_secure_random_key_min_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# MongoDB Database
MONGODB_URL=mongodb+srv://<user>:<password>@cluster0.mongodb.net
MONGODB_DB_NAME=ai_placement_db

# Qdrant Vector DB
QDRANT_URL=https://<your-cluster-id>.qdrant.io:6333
QDRANT_API_KEY=<your_qdrant_api_key>
QDRANT_COLLECTION_NAME=candidate_memories

# Groq LLM API
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Storage
STORAGE_DIR=storage/resumes
MAX_UPLOAD_SIZE_MB=10
```

---

## 📂 Repository Structure

```
ai-placement-agent/
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules for Python, Node & logs
├── docker-compose.yml               # Local container orchestration
├── README.md                        # Master project documentation
│
├── docs/                            # Architectural schemas & prompts
│   └── prompts/                     # Grounded extraction & matching prompts
│       ├── jd_analysis.v1.md
│       ├── resume_extraction.v1.md
│       ├── matching_explanation.v1.md
│       └── skill_gap_roadmap.v1.md
│
├── plans/                           # Comprehensive phase roadmaps
│   ├── master_implementation_plan.md
│   ├── phase_01_foundation.md to phase_10_production_hardening.md
│
├── backend/                         # FastAPI Python Core
│   ├── app/
│   │   ├── agents/                  # Autonomous ReAct orchestrator
│   │   ├── api/v1/endpoints/        # Auth, Resumes, Jobs, Matching, Memory, etc.
│   │   ├── core/                    # Config, Security, Logging, Guardrails
│   │   ├── db/                      # Beanie ODM & MongoDB session
│   │   ├── models/                  # ODM Document definitions
│   │   ├── providers/               # LLM, Embedding & Ingestion providers
│   │   ├── rag/                     # Vector store manager & semantic chunker
│   │   ├── schemas/                 # Pydantic request/response models
│   │   ├── services/                # Business logic & evaluators
│   │   └── tools/                   # Strongly-typed agent tool registry
│   ├── scripts/                     # seed_database.py
│   ├── tests/                       # Unit and integration test suites
│   ├── pyproject.toml
│   └── requirements.txt
│
└── frontend/                        # React 18 + Vite Single Page Application
    ├── src/
    │   ├── api/                     # Axios API clients
    │   ├── components/              # Layout, Modals, Kanban, Terminal, Agent UI
    │   ├── context/                 # AuthContext & Session State
    │   ├── pages/                   # LandingPage, Dashboard, Jobs, Interviews, etc.
    │   └── types/                   # TypeScript interfaces
    ├── index.html
    ├── package.json
    └── tailwind.config.js
```

---

## 🎯 Implementation Status

- [x] **Phase 1:** Foundation, JWT Auth, Beanie ODM & Profile CRUD
- [x] **Phase 2:** Resume Parser (PDF/Docx), LLM Extraction & Profile Sync
- [x] **Phase 3:** Job Intelligence, SHA-256 Deduplication & JD Analyzer
- [x] **Phase 4:** 3D Grounded Match Engine & Adaptive Learning Roadmaps
- [x] **Phase 5:** Autonomous ReAct Agent, Typed Tools & HITL Guardrails
- [x] **Phase 6:** Qdrant Semantic Vector RAG & Candidate Memory Explorer
- [x] **Phase 7:** Dynamic Mock Interview Arena & 3-Pillar Rubric Evaluator
- [x] **Phase 8:** 8-Stage Kanban Application Tracker & In-App Notifications
- [x] **Landing Page:** Interactive Product Showcase & Visual Onboarding
- [ ] **Phase 9:** Golden Evaluation Suite (400 Test Cases & F1 / Groundedness Benchmarks)
- [ ] **Phase 10:** Production Hardening, Rate Limiting & Final Polish

---

## 📄 License
This project is licensed under the MIT License.
