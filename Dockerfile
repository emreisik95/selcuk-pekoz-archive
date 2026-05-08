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
RUN npm run build && npm run build:scripts

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

# Pre-bundled sync scripts — single .cjs files, no runtime tsx needed.
COPY --from=builder --chown=app:app /app/dist/scripts ./dist/scripts

# Seed data — checked into the repo. The scheduled `npm run sync` task
# overwrites these files in place at runtime.
COPY --from=builder --chown=app:app /app/data ./data

USER app
EXPOSE 3000

CMD ["node", "server.js"]
