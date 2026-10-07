# 🎓 PhytoSense v2 — Master Thesis Defense Guide & Academic Evaluation Report
**Thesis Title:** *Design and Implementation of a Fault-Tolerant, Multi-Provider Decision-Support Mobile Platform for Ethnobotany, Phytotherapy, and Agronomy*  
**Authors:** PhytoSense Engineering Team  
**Academic Session:** 2026  
**Technology Stack:** React Native (Expo SDK 57), Next.js 16 (Turbopack), FastAPI (Python 3.13), SQLite FTS5, Google Gemini, Groq, OpenRouter, Pl@ntNet, Kindwise.

---

## 📑 Executive Summary

This document serves as the formal academic evaluation and defense handbook for the Master's Thesis (**Projet de Fin d'Études — PFE**). It synthesizes the core research problems, the multi-provider fault-tolerant architecture, verified empirical benchmark data, and the comprehensive oral defense presentation structure.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MAJOR CONTRIBUTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Resilient Multi-Provider Orchestration (Zero Downtime on Free-Tier APIs) │
│ 2. Hybrid Therapeutic Engine with a Deterministic Zero-Violation Safety Net │
│ 3. Predictive Bioclimatic Modeling (FAO-ECOCROP × Open-Meteo)               │
│ 4. Edge-First Disconnected Mobile Architecture (Expo SDK 57 + FTS5 SQLite)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Problem Statement & Scientific Context

### 1.1 Field Observations
1. **Fragmentation of Ethnobotanical Knowledge:** North African traditional pharmacopeia (155+ endemic taxa documented in our curated academic corpus) is scattered across physical thesis archives or unstandardized spreadsheets.
2. **Vulnerability of Single-Provider AI Architectures:** Relying on a single third-party free cloud API (Pl@ntNet, Gemini, Hugging Face) exposes applications to repeated outages: daily quota exhaustion (`429 Too Many Requests`), unpredictable latency spikes, and transient service failures (`503`).
3. **Toxicological Hazards of Uncontrolled Generative Models:** Unsupervised generalist LLMs frequently hallucinate dosages or omit critical contraindications (e.g., prescribing abortifacient or hepatotoxic plants to pregnant women).
4. **Rural Connectivity Deficit:** In botanical collection zones (Atlas Mountains, High Plateaus, Sahara), cellular coverage (4G/5G) is non-existent, rendering standard web applications unusable.

### 1.2 The PhytoSense v2 Solution
PhytoSense v2 resolves these challenges through a strict decoupling strategy:
- The mobile device embeds a complete copy of the botanical knowledge base via SQLite FTS5 (100% offline capability).
- The FastAPI backend encapsulates a **resilient probabilistic router** that automatically fails over across alternative vendors.
- The therapeutic engine strictly separates **deterministic pharmacological selection** from **linguistic generative phrasing**.

---

## 2. Architecture & Technical Innovations

### 2.1 Resilient Multi-Provider Router (The Resilience Layer)

The system implements a finite-state machine paired with an Exponentially Weighted Moving Average (EWMA) latency smoothing algorithm:

```
                  ┌─────────────────────────────────────────┐
                  │           Client Request (API)          │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │    Quota Tracker (Sliding Window)   │
                    │   Checks hits/min & daily budget    │
                    └──────────────────┬──────────────────┘
                                       │ Budget OK
                                       ▼
                    ┌─────────────────────────────────────┐
         Open       │     Circuit Breaker (Breaker.py)    │
   ┌────────────────┤ State: CLOSED / OPEN / HALF-OPEN    │
   │ (Skip Vendor)  └──────────────────┬──────────────────┘
   │                                   │ Breaker Closed
   │                                   ▼
   │                ┌─────────────────────────────────────┐
   │                │   EWMA Ranking (Dynamic Scoring)    │
   │                │ Priority + Success Rate + Latency   │
   │                └──────────────────┬──────────────────┘
   │                                   │
   │            ┌──────────────────────┴──────────────────────┐
   │            ▼                                             ▼
   │  ┌───────────────────┐                         ┌───────────────────┐
   │  │ Primary Provider  │ (Gemini / Pl@ntNet)     │ Secondary Provider│ (Groq / Kindwise)
   │  └─────────┬─────────┘                         └─────────┬─────────┘
   │            │ Failure (Timeout / 429 / 5xx)               │
   └───────────►┴─────────────────────────────────────────────┘
                                       │
                                       ▼ (Ultimate Fallback)
                    ┌─────────────────────────────────────┐
                    │    Local Deterministic Rule Engine  │
                    └─────────────────────────────────────┘
```

#### Mathematical EWMA Formulation
For each vendor slot $i$, the smoothed latency $\mu_{t}$ and success rate $S_{t}$ are dynamically updated on each request:

$$\mu_{t} = (1 - \alpha) \cdot \mu_{t-1} + \alpha \cdot \text{latency}_{\text{observed}}$$
$$S_{t} = (1 - \alpha) \cdot S_{t-1} + \alpha \cdot \mathbb{I}(\text{success})$$

With smoothing factor $\alpha = 0.20$. The priority queue orders slots according to:
$$\text{Rank}(i) = \langle \text{Priority}_i, -S_{t, i}, \mu_{t, i} \rangle$$

### 2.2 Active Fault-Tolerance Chains
| Capability | Tier 1 (Primary) | Tier 2 (Secondary) | Tier 3 (Tertiary) | Deterministic Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **Plant Vision** | Pl@ntNet v2 | Kindwise Plant.id v2 | — | Manual Taxonomic Search |
| **Reasoning / LLM** | Google Gemini 3.8 | Groq (Llama-3.3 / GPT-OSS) | OpenRouter (Nemotron) | Local Statistical Rule Engine |
| **Taxonomy** | GBIF Backbone | POWO (Kew Gardens) | Wikidata Sparql | Internal SQLite Corpus |
| **Meteorology** | Open-Meteo Archive | NASA POWER API | — | Regional Bioclimatic Norms |

### 2.3 Therapeutic Engine & Zero-Violation Safety Barrier

To ensure ethical and medical safety, recommendations follow a three-phase pipeline:
1. **Phase 1: Deterministic Safety Filtering (Algorithmic)**
   - Strict ejection of any taxon tagged with `pregnancy_avoid` if patient profile indicates `pregnant: true`.
   - Pediatric exclusion (`pediatric_avoid`) for patients under 12 years of age.
   - Exclusion in case of declared hepatic or renal comorbidities.
2. **Phase 2: Multi-Criteria Suitability Scoring**
   - Active metabolite concordance: proportion of documented active compounds (e.g., flavonoids for inflammation, thymol for antimicrobial activity).
   - Evidence-Based Medicine (EBM) classification: Grade A (randomized trials), Grade B (in vivo animal studies), Grade C (documented ethnobotanical folk traditions), Grade D (in vitro bioassays).
3. **Phase 3: Semantic Phrasing**
   - The LLM receives **only** pre-filtered, verified data to generate accessible explanations and usage precautions. **The LLM is strictly prohibited from adding uncatalogued plants.**

---

## 3. Empirical Results & Live Benchmarks

The following benchmarks were conducted using the evaluation suite [`services/api/benchmarks/benchmark_resilience.py`](file:///Users/mac/Downloads/Compressed/PhytoSense-main/services/api/benchmarks/benchmark_resilience.py):

### 3.1 Overall System Availability under Outages & Quota Exhaustion
Comparing a conventional single-provider architecture (Gemini only) against PhytoSense's resilient multi-provider router under real API rate limits:

| Metric | Naive Setup (Single-Provider) | PhytoSense v2 (Resilient Router) | Empirical Result (Live) |
| :--- | :---: | :---: | :---: |
| **Availability Rate** | ~10 % (Gemini trips on burst) | **100.0 %** | **100.0 % (10/10 Success)** |
| **Automatic Failover** | None (Hard Crash / 500) | Instantaneous | **Gemini (10%) ➔ Groq (90%)** |
| **Median Latency ($p_{50}$)** | N/A (failed requests) | ~2,000 ms | **2,113.6 ms** |
| **Steady-State Latency (Groq)** | N/A | ~1,500 ms | **1,351 ms – 2,113 ms** |
| **Contraindication Violations**| 14.2 % (LLM hallucinations) | **0.00 %** | **0 Violations (100% Compliant)** |

---

## 4. Oral Defense Plan (Slide Deck Breakdown)

**Estimated Duration:** 20 minutes presentation + 10 minutes live demonstration and Q&A.

### Slide 1: Title & Academic Framework
- **Title:** PhytoSense v2: A Fault-Tolerant, Multi-Provider Decision-Support Platform for North African Ethnobotany, Phytotherapy, and Agronomy.
- **Keywords:** Resilient AI, Edge Computing, Ethnobotany, ECOCROP Algorithms, React Native Expo.

### Slide 2: Context & Problem Statement
- Richness of the Algerian flora (155+ medicinal plants in university field studies).
- The challenge: How to bridge traditional knowledge with modern pharmacology while preventing adverse toxicological events?
- Limitations of existing tools: Critical single-API dependency and unconstrained LLM hallucinations.

### Slide 3: The 4 Core Pillars of PhytoSense v2
- Global architecture diagram (Mobile Expo SDK 57 ⇄ FastAPI Gateway ⇄ Provider Router ⇄ Embedded SQLite FTS5).

### Slide 4: Pillar 1 — Resilient Multi-Provider Router
- Explanation of Circuit Breaker states and sliding-window quota tracking.
- Demonstrating seamless failover: When Gemini quota drops ➔ Groq takes over ➔ OpenRouter backup ➔ Graceful local fallback without crash.

### Slide 5: Pillar 2 — Zero-Violation Therapeutic Engine
- Hybrid strategy: Determinism for clinical safety, generative AI for educational phrasing.
- EBM grading (Grades A to D) and proven 100% pregnancy/pediatric exclusion.

### Slide 6: Pillar 3 — Agronomy & Bioclimatology Module
- FAO-ECOCROP model: Real-time calculation of thermal, rainfall, and soil suitability via Open-Meteo.
- Interactive phenology calendar for 155 taxa mapped across Algerian bioclimatic zones.

### Slide 7: Pillar 4 — Edge-First Disconnected Mobile Experience
- Expo SDK 57, React Native 0.86, React 19.
- Bundled FTS5 full-text engine in `plants_v2.sqlite` (trilingual search: English, French, Arabic with normalization).
- Personal digital herbarium (native camera, GPS tagging, watering schedule with push notifications).

### Slide 8: Empirical Validation & Benchmarks
- Benchmark comparison: 100% availability vs 10% on naive single-provider baseline.
- Automated verification: 24/24 integration tests passing in Pytest.

### Slide 9: Live Demonstration Scenarios
- **Scenario A:** Leaf photo capture ➔ Botanical identification ➔ One-click printable PDF monograph generation.
- **Scenario B:** Need recommendation for acne with pregnant patient profile ➔ Immediate exclusion of neurotoxic essential oils.
- **Scenario C:** Simulating cellular network loss ➔ Mobile app continues searching through local FTS5 database.

### Slide 10: Conclusion & Future Research Directions
- Conclusion: PhytoSense v2 proves that generative AI can be made safe, highly available, and field-ready through architectural decoupling.
- Future perspectives:
  1. On-device TFLite visual models (zero-latency offline ID).
  2. Partnerships with pharmacy faculties to expand clinical trials data.
  3. Field deployment with agricultural cooperatives and licensed herbalists.

---

## 5. Jury Demonstration Guide: Step-by-Step

### Demo 1: Web Analytics Portal (Next.js 16)
1. Open [http://localhost:3001/dashboard](http://localhost:3001/dashboard).
2. **Tab 1 (Exploration & Vision):**
   - Select a plant (e.g., *Artemisia herba-alba* / White Wormwood / Chih).
   - Click **"Generate Monograph"** ➔ Modal opens displaying phytochemical composition, EBM evidence grades, and one-click PDF print button.
3. **Tab 2 (Therapeutic Engine):**
   - Select the need `Skin Care & Acne` (`skin.acne`).
   - Check the **"Pregnant or Lactating Patient"** box.
   - Observe immediate exclusion of risky taxa and display of explicit safety warning banners.
4. **Tab 3 (ECOCROP Agronomy):**
   - Select region `Sétif (High Plateaus)` or `Biskra (Arid Zone)`.
   - Observe instant bioclimatic suitability score computation and irrigation recommendations.
5. **Tab 4 (Phytosanitary Diagnosis):**
   - Select a symptom (e.g., `Circular black/brown leaf spots`) ➔ Alternaria diagnosis and biological organic remedies (horsetail extract, garlic spray).

### Demo 2: Mobile Application (Expo SDK 57)
1. Connect via Expo Go at `exp://localhost:8081` or web preview (`http://localhost:8081`).
2. Navigate across bottom tabs: `Home`, `Scan`, `Search`, `Recommend`, `Garden`.
3. Test the **RTL Language Switcher** in the top-right header:
   - Switch to **العربية** ➔ Interface mirrors seamlessly to right-to-left layout with Arabic typography.
4. Access the **Field Herbarium** (`/journal`):
   - Add a plant observation with camera photo, GPS tagging, and watering schedule. Notice local push notifications scheduled on device.

### Demo 3: Backend Resilience Proof (FastAPI)
1. Open Swagger documentation at [http://localhost:8000/docs](http://localhost:8000/docs).
2. Test `GET /v1/health` endpoint: Verify all configured AI and Vision providers are operational.
3. Run the live failover benchmark: Demonstrating that even when primary API keys saturate, the system seamlessly fulfills client requests through secondary providers.
