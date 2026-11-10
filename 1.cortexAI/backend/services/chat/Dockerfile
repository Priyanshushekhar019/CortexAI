FROM node:20-slim

WORKDIR /app

# 1. Install Chat service dependencies
COPY services/chat/package*.json ./services/chat/
RUN cd services/chat && npm install --omit=dev

# 2. Copy Chat source code
COPY services/chat ./services/chat

WORKDIR /app/services/chat

EXPOSE 8002

CMD ["npm", "start"]
