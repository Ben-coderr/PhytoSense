# 🌿 PhytoSense v2 — Resilient Botanical Intelligence & Phytotherapy Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org/)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev/)
[![React 19](https://img.shields.io/badge/React-19.2.3-blue?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3.8%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Groq](https://img.shields.io/badge/Groq-LPU%20Inference-f55036)](https://groq.com/)
[![Pl@ntNet](https://img.shields.io/badge/Pl%40ntNet-Vision%20Tier%201-2e7d32)](https://my.plantnet.org/)
[![Kindwise](https://img.shields.io/badge/Kindwise-Vision%20Tier%202-0284c7)](https://kindwise.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **PhytoSense v2** bridges centuries-old botanical knowledge and modern artificial intelligence. It allows researchers, pharmacists, and nature enthusiasts to identify medicinal plants, discover their active phytochemicals (alkaloids, flavonoids, terpenes), predict potential therapeutic pharmacology, evaluate bioclimatic suitability across Algerian terroirs, and maintain field journals with offline-first mobile capabilities.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Dataset & Phytochemical Corpus](#-dataset--phytochemical-corpus)
- [Quick Start & Installation](#-quick-start--installation)
  - [Prerequisites](#prerequisites)
  - [1. Environment Configuration](#1-environment-configuration)
  - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
  - [3. Frontend Setup (Next.js)](#3-frontend-setup-nextjs)
- [API Documentation](#-api-documentation)
- [Academic Context & PFE Defense](#-academic-context--pfe-defense)
- [Medical Disclaimer](#-medical-disclaimer)

---

## 🌟 Overview

Originating as an academic Final-Year Engineering Project (**Projet de Fin d'Études — PFE**), **PhytoSense v2** transforms static botanical records into an **active research, agronomy, and diagnostic engine**:
1. **Identifies** unknown flora via live camera capture, uploaded photos, or multilingual fuzzy search with zero-downtime failover between **Pl@ntNet** and **Kindwise Plant.id**.
2. **Retrieves** verified phytochemical profiles (chemical constituents, affected plant organs, geographic harvest locations, traditional usage).
3. **Hypothesizes** therapeutic actions via **Google Gemini 3.8 Flash**, **Groq**, and **OpenRouter**, synthesizing compound-activity relationships with evidence grades (A/B/C/D).
4. **Evaluates Bioclimatic Agronomy**: Calculates FAO-ECOCROP suitability indices (temperature, rainfall, soil) across Algerian climates (Alger, Oran, Constantine, Batna, Biskra, Ghardaïa) with seasonal cultivation calendars.
5. **Diagnoses Plant Diseases & Pests**: Diagnoses 14 observable symptoms with organic biological treatments (purin d'ortie, savon noir, prêle).
6. **Mobile Herbarium & Field Journal**: Offline-first mobile app (Expo SDK 57) with SQLite FTS5 search, GPS coordinates, watering schedule, and official printable scientific monographs.

---

## ✨ Key Features

- **📸 Multimodal Plant Recognition (Multi-Provider Failover)**:
  - **Live Webcam / Mobile Camera**: Integrated camera interface to take real-time snapshots in the field.
  - **Pl@ntNet + Kindwise Plant.id**: Automatic tier-2 fallback if primary quotas or network fail.
  - **Multilingual Offline FTS5 Search**: Tolerant SQLite search across Latin scientific names, French vernacular names, and Arabic traditional names.
- **🔬 Phytochemical & Biological Activity Mapping**:
  - Structured extraction of active chemical classes: *alcaloïdes, flavonoïdes, polyphénols, terpènes, saponines, tanins, huiles essentielles*.
  - Historical therapeutic records: *antioxydant, antibactérien, cicatrisant, anti-inflammatoire, antidiabétique, analgésique*.
- **🧠 AI-Powered Pharmacological Prediction (Gemini 3.8 Flash & Groq)**:
  - Predicts probable therapeutic targets and mechanisms of action based on the verified compound matrix with detailed scientific justifications and evidence grading (A/B/C/D).
- **💡 Therapeutic Recommender Engine**:
  - Recommends medicinal plants by symptom/need with strict pregnancy and pediatric safety exclusions.
- **🌦️ Bioclimatic Agronomy & Climatology**:
  - Real-time weather integration with Open-Meteo and FAO-ECOCROP trapezoidal suitability formula.
- **🩺 Plant Disease & Pest Diagnosis**:
  - 14 observable phytopathological symptoms paired with biological treatments.
- **📖 Mobile Herbarium & Journal**:
  - Offline field logging with GPS coordinates, photo capture, and irrigation schedules.
- **📄 Printable Official Scientific Monograph**:
  - Generates standardized printable monographs formatted for academic botanical defenses.
- **🌍 Trilingual & Culturally Adaptive UI**:
  - Native support for **English**, **French**, and **Arabic (العربية)** with automatic bidirectional layout switching (**LTR / RTL**).

---

## 🔄 How It Works

```mermaid
flowchart TD
    A[User Input] -->|Camera Snapshot / Photo| B[Pl@ntNet Vision API]
    A -->|Text Search| C[RapidFuzz Search]
    
    B -->|Scientific Species Name| D{Found in Local DB?}
    C -->|Query Match >= 60%| D
    
    D -->|Yes: Local Record| E[Curated Phytochemical Profile]
    E --> F[Gemini 2.5 Flash Prediction]
    F --> G[Full Plant Dossier & AI Report]
    
    D -->|No: Unrecorded Plant| H[Autonomous Deep Research]
    H --> I[Gemini: Extract Key Phytochemicals]
    I --> J[Vector-like Match Against Local Flora DB]
    K --> L[Synthesize Shared Compounds & Predict Activity]
    L --> G
```

---

## 🏗 System Architecture

PhytoSense v2 employs a modern pnpm monorepo architecture with clean boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PhytoSense Monorepo                           │
│                                                                        │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐   │
│   │     Next.js 16 Web App      │    │     Expo SDK 57 Mobile      │   │
│   │   (React 19, Port 3001)     │    │   (React Native 0.86, FTS5) │   │
│   └──────────────┬──────────────┘    └──────────────┬──────────────┘   │
└──────────────────┼──────────────────────────────────┼──────────────────┘
                   │ HTTP / JSON                      │ Over-the-Air Sync
                   ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FastAPI Resilient Gateway (Port 8000)                │
│       Circuit Breakers • Latency Router (EWMA) • Sliding Quotas        │
└──────────────┬──────────────────────────────┬──────────────────────────┘
               │                              │
     Vision Failover Chain          Reasoning Failover Chain
               │                              │
     ┌─────────┴─────────┐          ┌─────────┴─────────────────────┐
     ▼                   ▼          ▼         ▼          ▼          ▼
┌─────────┐         ┌─────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌───────┐
│ Pl@ntNet│         │Kindwise │ │ Gemini │ │ Groq │ │OpenRouter│ │Rule-  │
│ Tier 1  │──Fail──>│ Tier 2  │ │3.8Flash│ │LPU   │ │Nemotron  │ │Based  │
└─────────┘         └─────────┘ └────────┘ └──────┘ └──────────┘ └───────┘
```

---

## 💻 Technology Stack

### Monorepo & Mobile
- **Package Manager**: pnpm workspaces
- **Mobile Framework**: [Expo SDK 57](https://expo.dev/) (React 19.2.3, React Native 0.86.3)
- **Navigation**: Expo Router v57 (typed file-system routing)
- **Local Database**: SQLite with FTS5 Full-Text Search (155 plants, 406 normalized names)
- **Native Hardware**: Camera (`expo-camera`), Location GPS (`expo-location`), Gallery (`expo-image-picker`)
- **Internationalization**: i18next with dynamic RTL rendering (`en`, `fr`, `ar`)

### Web Frontend
- **Framework**: [Next.js 16.2.9](https://nextjs.org/) (React 19.2, App Router, Turbopack)
- **Icons**: Lucide React
- **Design System**: Handcrafted responsive glassmorphism with emerald botanical tokens
- **Printing**: Native `@media print` CSS for official scientific monographs

### Backend & AI Gateway
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn (Python 3.10+)
- **Database & Offline Engine**: Embedded SQLite FTS5 (`data/curated/plants_v2.sqlite`) — **100% Natif, Zéro Dépendance Docker**
- **Resilience**: Custom Circuit Breaker, Sliding-Window Quota Tracker, EWMA Latency Router
- **Vision Providers**: Pl@ntNet API (Tier 1) ➔ Kindwise Plant.id (Tier 2 failover)
- **LLM Providers**: Google Gemini 3.8 Flash ➔ Groq ➔ OpenRouter ➔ Mistral ➔ Rule-based fallback
- **Agronomy Model**: FAO-ECOCROP trapezoidal suitability formula + Open-Meteo API
- **Testing**: Pytest test suite (24/24 unit & integration tests)

---

## 📂 Repository Structure

```
PhytoSense/
├── apps/
│   ├── web/                         # Next.js 16 Web Portal (Port 3001)
│   │   ├── src/                     # App Router, components, glassmorphism tokens
│   │   ├── public/                  # High-resolution botanical assets & logos
│   │   └── package.json             # @phytosense/web dependencies
│   └── mobile/                      # Expo SDK 57 React Native (Port 8081)
│       ├── app/                     # File-system routes (tabs, plant, journal, research)
│       ├── src/lib/                 # Offline SQLite FTS5 engine, theme, i18n
│       └── package.json             # @phytosense/mobile dependencies
├── services/
│   └── api/                         # FastAPI v2 Resilient Backend Gateway (Port 8000)
│       ├── app/                     # Routers, multi-tier AI providers, circuit breakers
│       ├── tests/                   # Pytest test suite (24 unit and integration tests)
│       └── benchmarks/              # PFE resilience & failover benchmark suite
├── packages/
│   └── i18n/                        # Single source of truth for translations (en, fr, ar)
├── data/
│   ├── curated/                     # Normalized SQLite database (plants_v2.sqlite, 155 taxa)
│   ├── raw/                         # Raw ethnobotanical datasets (Excel)
│   └── pipelines/                   # ETL & SQLite database ingestion pipelines
├── docs/                            # Project Documentation & PFE Defense Materials
│   ├── PFE_PRESENTATION_SLIDES.html # Interactive HTML slide deck for PFE defense
│   ├── PHYTOSENSE_PFE_DEFENSE_GUIDE.md # Defense preparation & empirical benchmarks
│   ├── PHYTOSENSE_DOCUMENTATION.md  # Comprehensive technical architecture guide
│   └── PHYTOSENSE_V2_BLUEPRINT.md   # Architectural blueprint & specification
├── scripts/                         # Operational & Verification Scripts
│   ├── verify_system.py             # Master system verification suite (16 checks)
│   └── test_ai.py                   # Multi-tier AI provider failover validation
├── dev.sh                           # Native zero-docker development runner
├── pnpm-workspace.yaml              # Monorepo workspace configuration
├── pnpm-lock.yaml                   # Dependency lockfile
└── README.md                        # Master project documentation
```

---

## 🌿 Dataset & Phytochemical Corpus

The core database of PhytoSense is extracted from an academic compilation of Algerian medicinal plants (`tableau 2...xlsx`). The data engineering pipeline performs:
- **Deduplication & Normalization**: Resolves duplicates (such as *Calobota saharae*) and merges complementary records.
- **Name & Note Disambiguation**: Splits vulgar names from taxonomic notes, vernacular dialect markers (e.g. *en tamahaq*, *en arabe*), and regional synonyms.
- **Phytochemical & Activity Tagging**: Categorizes compound families (*alcaloïdes, polyphénols, flavonoïdes, terpènes, tanins, etc.*) and medicinal indications.

### Dataset Overview:
- **Total Species**: 155 curated records
- **Unique Botanical Families**: 69 (e.g., *Lamiaceae, Asteraceae, Fabaceae, Brassicaceae, Apiaceae*)
- **Geographic Coverage**: Algerian Sahara, Atlas Mountains, High Plateaus, Mediterranean coast (Sétif, Biskra, Tamanrasset, etc.)

---

## 🚀 Quick Start (100% Native — Zero Docker)

No heavy virtual machines or bulky Docker containers! Everything runs natively on your machine with near-instant startup (< 2s) and negligible memory footprint (< 200 MB).

### Prerequisites
- **Node.js**: v20+
- **pnpm**: v9+ or v10+
- **Python**: v3.10+
- **API Keys**: Configured in `.env` (Gemini, Pl@ntNet, Kindwise, Groq, OpenRouter)

### 1. One-Time Setup
```bash
pnpm install
```

### 2. Single-Command Launch

```bash
./dev.sh
# or via pnpm:
pnpm dev
```

This runner automatically:
1. **Frees reserved ports** (8000, 3001, 8081) if stale processes remained from previous sessions.
2. Concurrently starts **FastAPI Gateway** (port 8000), **Next.js Web Portal** (port 3001), and **Expo Mobile Bundler** (port 8081).
3. Intercepts `Ctrl+C` to **gracefully terminate all child processes** with zero lingering zombies.

### Tailored Launch Modes:
```bash
./dev.sh --web      # Starts Web Portal + Backend API
./dev.sh --mobile   # Starts Mobile App + Backend API
./dev.sh --api      # Starts Backend API only
./dev.sh --clean    # Immediately releases all occupied ports
```

---

## 🌐 Service Access URLs
- **Backend FastAPI & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Next.js Web Analytics Portal:** [http://localhost:3001/dashboard](http://localhost:3001/dashboard)
- **Expo Mobile App (SDK 57):** [exp://localhost:8081](exp://localhost:8081) (or press `w` in terminal for web preview)
- **Interactive PFE Defense Slides:** Open [`PFE_PRESENTATION_SLIDES.html`](file:///Users/mac/Downloads/Compressed/PhytoSense-main/PFE_PRESENTATION_SLIDES.html) in any browser.

## 📡 API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and welcome health check |
| `GET` | `/api/plants/search?q={query}` | Multilingual fuzzy search across Latin, French, and Arabic plant names |
| `GET` | `/api/plants/{id}` | Retrieve full scientific and phytochemical record for a specific plant |
| `GET` | `/api/plants/{id}/predict` | Generate AI therapeutic predictions with Gemini based on plant composition |
| `POST` | `/api/plants/identify` | Multipart image upload identified via Pl@ntNet API and matched against local DB |
| `POST` | `/api/plants/research` | Autonomous Deep Research pipeline for plants not present in the local database |

---

## 🔬 Novel Feature: Autonomous Deep Research

One of PhytoSense's major engineering innovations is its **Autonomous Deep Research & Cross-Referencing Engine** ([`api/services/ai_service.py`](file:///Users/mac/Downloads/Compressed/PhytoSense-main/api/services/ai_service.py)):

1. **Species Discovery**: When a user uploads a photo of an exotic or uncatalogued plant (e.g. *Echinacea purpurea*), Pl@ntNet identifies the botanical taxon.
2. **Local DB Fallback**: The local database check confirms no direct entry exists (`found_local: false`).
3. **Chemical Compound Extraction**: PhytoSense queries Gemini to retrieve the known active phytochemical matrix (e.g. *cichoric acid, echinacoside, alkylamides*).
4. **Local Database Cross-Referencing**: The engine scans the 155 local plants to discover which endemic Algerian plants share identical or biosimilar active compounds.
5. **Therapeutic Inference**: Gemini evaluates the shared chemical basis and projects predicted therapeutic benefits while explicitly linking them to analogous local plants.

---

## 🎓 Academic Context & PFE Defense

This project was engineered to satisfy the rigor of a university **Projet de Fin d'Études (PFE)**:
- **Scientific Traceability**: All local records cite original source authors and harvest locations.
- **Transparency**: AI predictions are clearly distinguished from empirically verified literature data.
- **Graceful Degradation**: Low-confidence or failed visual identifications trigger fallback workflows rather than misleading the user.

---

## ⚠️ Medical Disclaimer

> **IMPORTANT**: PhytoSense is designed exclusively for scientific education, academic research, and botanical exploration. **It does not provide medical diagnoses, treatment plans, or clinical recommendations.** Always consult a certified healthcare professional before ingesting or utilizing any plant preparations for medicinal purposes.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
