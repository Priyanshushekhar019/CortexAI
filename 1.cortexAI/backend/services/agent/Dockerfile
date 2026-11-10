FROM node:20-slim

WORKDIR /app

# 1. Install Agent service dependencies directly
COPY services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install --omit=dev

# 2. Mark /app as ES module & install shared module dependencies (ioredis, dotenv)
RUN echo '{"type":"module"}' > /app/package.json && npm install ioredis dotenv --omit=dev --no-package-lock

# 3. Copy Agent and Shared source code
COPY services/agent ./services/agent
COPY shared ./shared

WORKDIR /app/services/agent

EXPOSE 8003

CMD ["npm", "start"]
