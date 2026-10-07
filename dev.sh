#!/usr/bin/env bash
# ==============================================================================
# 🌿 PhytoSense v2 — Zero-Docker Native Development Runner
# ==============================================================================
# Coordinates native microservices (FastAPI, Next.js, Expo) without virtual
# machines, Docker containers, or hypervisor memory overhead.
# ==============================================================================

set -e

GREEN='\033[0;32m'
EMERALD='\033[38;5;48m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "${EMERALD}${BOLD}"
echo "  🌿 ────────────────────────────────────────────────────────── 🌿"
echo "        PhytoSense v2 — Native Development Suite (Zero Docker)"
echo "  🌿 ────────────────────────────────────────────────────────── 🌿"
echo -e "${NC}"

# 1. Port sentinel to eliminate stale zombie processes
kill_port() {
  local port=$1
  local name=$2
  local pid=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}⚠️  Port $port ($name) already in use by PID $pid. Releasing...${NC}"
    kill -9 $pid 2>/dev/null || true
    sleep 0.5
  fi
}

# 2. Graceful shutdown handler for Ctrl+C
PIDS=()
cleanup() {
  echo -e "\n${YELLOW}🛑 Gracefully stopping all PhytoSense services...${NC}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  sleep 1
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
  echo -e "${GREEN}✅ All services stopped. Ports freed.${NC}\n"
  exit 0
}
trap cleanup SIGINT SIGTERM

# 3. Argument parsing
MODE="${1:---all}"

if [ "$MODE" == "--clean" ]; then
  echo -e "${CYAN}🧹 Cleaning ports (8000, 3001, 8081)...${NC}"
  kill_port 8000 "FastAPI Gateway"
  kill_port 3001 "Next.js Web Portal"
  kill_port 8081 "Metro Mobile Bundler"
  echo -e "${GREEN}✨ All ports successfully released.${NC}"
  exit 0
fi

# Pre-emptive port cleanup
kill_port 8000 "FastAPI Gateway"
if [ "$MODE" == "--all" ] || [ "$MODE" == "--web" ]; then
  kill_port 3001 "Next.js Web Portal"
fi
if [ "$MODE" == "--all" ] || [ "$MODE" == "--mobile" ]; then
  kill_port 8081 "Metro Mobile Bundler"
fi

# 4. Start FastAPI Gateway (Port 8000)
start_api() {
  echo -e "${GREEN}🚀 [1/3] Starting FastAPI Gateway (Port 8000)...${NC}"
  PYTHONPATH=services/api python3 -m uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000 --reload &
  API_PID=$!
  PIDS+=($API_PID)
  echo -e "   ↳ FastAPI PID: $API_PID | Swagger Docs: ${CYAN}http://localhost:8000/docs${NC}"
}

# 5. Start Next.js Web Portal (Port 3001)
start_web() {
  echo -e "${GREEN}🚀 [2/3] Starting Next.js 16 Web Portal (Port 3001)...${NC}"
  pnpm --filter @phytosense/web dev -p 3001 &
  WEB_PID=$!
  PIDS+=($WEB_PID)
  echo -e "   ↳ Next.js PID: $WEB_PID | Dashboard URL: ${CYAN}http://localhost:3001/dashboard${NC}"
}

# 6. Start Expo Mobile Bundler (Port 8081)
start_mobile() {
  echo -e "${GREEN}🚀 [3/3] Starting Expo Mobile SDK 57 Bundler (Port 8081)...${NC}"
  cd apps/mobile && npx expo start -c &
  MOBILE_PID=$!
  PIDS+=($MOBILE_PID)
  cd "$ROOT_DIR"
  echo -e "   ↳ Expo PID: $MOBILE_PID | Metro URL: ${CYAN}exp://localhost:8081${NC}"
}

# Dispatch according to selected mode
case "$MODE" in
  --web)
    echo -e "${CYAN}Selected mode: Web Portal + Backend API${NC}"
    start_api
    sleep 1
    start_web
    ;;
  --mobile)
    echo -e "${CYAN}Selected mode: Mobile App + Backend API${NC}"
    start_api
    sleep 1
    start_mobile
    ;;
  --api)
    echo -e "${CYAN}Selected mode: Backend API only${NC}"
    start_api
    ;;
  --all|*)
    echo -e "${CYAN}Selected mode: Full Stack (Web + Mobile + Backend)${NC}"
    start_api
    sleep 1
    start_web
    sleep 1
    start_mobile
    ;;
esac

echo -e "\n${EMERALD}${BOLD}✨ 100% Native PhytoSense environment active!${NC}"
echo -e "${NC}Press ${BOLD}Ctrl+C${NC} anytime to cleanly terminate all services.\n"

# Await child processes
wait
