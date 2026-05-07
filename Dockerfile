# syntax=docker/dockerfile:1.7

# ── deps ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── builder ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# yt-dlp needs python; ffmpeg is optional but nice to have for shorts metadata.
RUN apk add --no-cache python3 yt-dlp tzdata && \
    addgroup -S app && adduser -S app -G app && \
    mkdir -p /app/data && chown -R app:app /app/data

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Europe/Istanbul

# Standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

# tsx runtime + sync script + libs (so the running container can run sync too)
COPY --from=builder --chown=app:app /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=app:app /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder --chown=app:app /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder --chown=app:app /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder --chown=app:app /app/scripts ./scripts
COPY --from=builder --chown=app:app /app/lib ./lib
COPY --from=builder --chown=app:app /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=app:app /app/package.json ./package.json

USER app
EXPOSE 3000

# data/ is a writable volume — sync writes here, Next reads here.
VOLUME ["/app/data"]

CMD ["node", "server.js"]
