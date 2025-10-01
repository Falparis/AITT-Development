# ---------- Base ----------
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---------- Build ----------
FROM base AS builder
COPY package*.json ./
# mount npm cache for faster GH Actions builds
RUN --mount=type=cache,target=/root/.npm npm ci --production=false
COPY . .

# ---------- Run ----------
FROM base AS runner
# drop privileges
USER node
COPY --from=builder /app ./
EXPOSE 4000
CMD ["npm", "start"]
