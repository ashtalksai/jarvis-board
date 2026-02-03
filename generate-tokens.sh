#!/bin/bash

echo "🔐 Generating secure tokens for Jarvis Board"
echo ""
echo "Add these to your .env file or docker-compose.yml:"
echo ""
echo "PERSONAL_TOKEN=$(openssl rand -hex 32)"
echo "AGENT_TOKEN=$(openssl rand -hex 32)"
echo ""
echo "Combined for API_TOKENS:"
echo "API_TOKENS=$(openssl rand -hex 32),$(openssl rand -hex 32)"
echo ""
echo "For HTTP Basic Auth password:"
echo "BASIC_AUTH_PASS=$(openssl rand -base64 16)"
