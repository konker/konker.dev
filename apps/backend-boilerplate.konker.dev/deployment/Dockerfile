#FROM node:lts-alpine AS runner
FROM node:24-slim AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 hono

# Copy prebuilt app from host .deploy directory
COPY --chown=hono:nodejs ../.deploy/dist ./dist
COPY --chown=hono:nodejs ../.deploy/node_modules ./node_modules
COPY --chown=hono:nodejs ../.deploy/package.json ./

USER hono
EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/hono/hono-node-server.js"]
