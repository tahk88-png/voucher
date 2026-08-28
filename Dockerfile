FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
# pnpm is this project's package manager: its lockfile is the one that
# resolves. `npm ci` fails here with an ERESOLVE peer conflict
# (@vercel/analytics optionally peers on @sveltejs/kit, which drags in a
# vite@^8 requirement), which previously broke every image build.
# Installed with npm rather than corepack: the corepack bundled with Node 20
# ships an older signing key and rejects recent pnpm releases.
RUN npm install -g pnpm@10.28.1
# .npmrc carries node-linker=hoisted. Without it, pnpm in the image used its
# default strict layout while local and CI installs were hoisted — so phantom
# (undeclared transitive) imports resolved everywhere except in Docker, where
# the build failed with "Cannot find module 'jose'". Copying it keeps install
# behaviour identical across all environments.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10.28.1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# instrumentation.ts validates env during `next build`. These are throwaway
# build-time placeholders confined to the builder stage — they never reach the
# runtime image, which validates the real values at startup.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/build_placeholder"
ENV AUTH_SECRET="docker-build-placeholder-secret-not-used-at-runtime"
# The client must be generated before `next build` imports @prisma/client.
# Nothing else does it here: the deps stage installs without prisma/schema.prisma
# present, and pnpm 10 does not run dependency build scripts by default, so
# @prisma/client's own postinstall never fires. CI's build job runs this same
# step explicitly.
RUN pnpm exec prisma generate
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
