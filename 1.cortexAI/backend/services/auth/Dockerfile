FROM node:20-slim

WORKDIR /app

# 1. Install Auth service dependencies directly
COPY services/auth/package*.json ./services/auth/
RUN cd services/auth && npm install --omit=dev

# 2. Mark /app as ES module & install shared module dependencies (ioredis, dotenv)
RUN echo '{"type":"module"}' > /app/package.json && npm install ioredis dotenv --omit=dev --no-package-lock

# 3. Copy Auth and Shared source code
COPY services/auth ./services/auth
COPY shared ./shared

WORKDIR /app/services/auth

EXPOSE 8001

CMD ["npm", "start"]
