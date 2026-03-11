FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

ENV NODE_ENV=production
RUN pnpm build
CMD ["pnpm", "start"]
