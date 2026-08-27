FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
# pnpm is this project's package manager: its lockfile is the one that
# resolves. `npm ci` fails here with an ERESOLVE peer conflict
# (@vercel/analytics optionally peers on @sveltejs/kit, which drags in a
# vite@^8 requirement), which previously broke every image build.
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# instrumentation.ts validates env during `next build`. These are throwaway
# build-time placeholders confined to the builder stage — they never reach the
# runtime image, which validates the real values at startup.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/build_placeholder"
ENV AUTH_SECRET="docker-build-placeholder-secret-not-used-at-runtime"
RUN pnpm run build:next

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/entrypoint.sh
EXPOSE 3000
CMD ["sh", "./scripts/entrypoint.sh"]
