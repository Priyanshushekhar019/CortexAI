FROM node:20-slim

WORKDIR /app

# 1. Install Billing service dependencies
COPY services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install --omit=dev

# 2. Copy Billing source code
COPY services/billing ./services/billing

WORKDIR /app/services/billing

EXPOSE 8004

CMD ["npm", "start"]
