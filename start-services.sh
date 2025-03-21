#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting NCN-AVS-STABLE Services${NC}\n"

# Create log directory
mkdir -p logs

# Check if services are already running
echo -e "${YELLOW}Checking for running services...${NC}"
if pgrep -f "npm run dev.*frontend" > /dev/null; then
  echo -e "${RED}Frontend service is already running. Please stop it first.${NC}"
  exit 1
fi

if pgrep -f "npm run dev.*bridge" > /dev/null; then
  echo -e "${RED}Bridge service is already running. Please stop it first.${NC}"
  exit 1
fi

if pgrep -f "camb avs run" > /dev/null; then
  echo -e "${RED}Cambrian AVS is already running. Please stop it first.${NC}"
  exit 1
fi

# Start Cambrian AVS
echo -e "\n${YELLOW}Starting Cambrian AVS...${NC}"
AVS_ID=${AVS_ID:-"9SDa7sMDqCDjSGQyjhMHHde6bvENWS68HVzQqqsAhrus"}

# Check if cambrian CLI is installed
if ! command -v camb &> /dev/null; then
  echo -e "${RED}Cambrian CLI is not installed or not in PATH. Skipping AVS startup.${NC}"
  echo -e "${YELLOW}The application will use mock data for oracles.${NC}"
else
  echo -e "${GREEN}Cambrian CLI found. Attempting to start AVS...${NC}"
  nohup camb avs run -u $AVS_ID > logs/avs.log 2>&1 &
  AVS_PID=$!
  echo -e "${GREEN}AVS started with PID: $AVS_PID${NC}"
  
  # Sleep to allow AVS to initialize
  echo -e "${YELLOW}Waiting for AVS to initialize...${NC}"
  sleep 5
fi

# Start Bridge service
echo -e "\n${YELLOW}Starting Bridge service...${NC}"
cd NCNs-AVS-JITO-PROGRAMS/bridge || {
  echo -e "${RED}Bridge directory not found!${NC}"
  exit 1
}

if [ ! -f "package.json" ]; then
  echo -e "${RED}Bridge package.json not found!${NC}"
  exit 1
fi

echo -e "${GREEN}Installing bridge dependencies...${NC}"
npm install

echo -e "${GREEN}Starting bridge service...${NC}"
nohup npm run dev > ../../logs/bridge.log 2>&1 &
BRIDGE_PID=$!
echo -e "${GREEN}Bridge service started with PID: $BRIDGE_PID${NC}"

# Sleep to allow bridge to initialize
echo -e "${YELLOW}Waiting for Bridge to initialize...${NC}"
sleep 5

# Start Frontend
echo -e "\n${YELLOW}Starting Frontend...${NC}"
cd ../../frontend || {
  echo -e "${RED}Frontend directory not found!${NC}"
  exit 1
}

if [ ! -f "package.json" ]; then
  echo -e "${RED}Frontend package.json not found!${NC}"
  exit 1
fi

echo -e "${GREEN}Installing frontend dependencies...${NC}"
npm install

echo -e "${GREEN}Starting frontend service...${NC}"
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend service started with PID: $FRONTEND_PID${NC}"

# Summary
echo -e "\n${BLUE}Services started:${NC}"
echo -e "${GREEN}AVS:${NC} Check logs at logs/avs.log"
echo -e "${GREEN}Bridge:${NC} Check logs at logs/bridge.log"
echo -e "${GREEN}Frontend:${NC} Check logs at logs/frontend.log"

# Instructions
echo -e "\n${BLUE}Application should be available at:${NC}"
echo -e "${GREEN}http://localhost:5173${NC}"

echo -e "\n${YELLOW}To stop all services, run:${NC}"
echo -e "pkill -f \"npm run dev.*frontend\""
echo -e "pkill -f \"npm run dev.*bridge\""
echo -e "pkill -f \"camb avs run\""

echo -e "\n${GREEN}Done!${NC}" 