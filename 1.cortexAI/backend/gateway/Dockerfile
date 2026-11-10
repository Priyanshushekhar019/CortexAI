FROM node:20-slim

WORKDIR /app

# 1. Install Gateway dependencies directly
COPY gateway/package*.json ./gateway/
RUN cd gateway && npm install --omit=dev

# 2. Mark /app as ES module & install shared module dependencies (ioredis, dotenv)
RUN echo '{"type":"module"}' > /app/package.json && npm install ioredis dotenv --omit=dev --no-package-lock

# 3. Copy Gateway and Shared source code
COPY gateway ./gateway
COPY shared ./shared

WORKDIR /app/gateway

EXPOSE 8000

CMD ["npm", "start"]
