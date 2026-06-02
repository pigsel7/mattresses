FROM node:22-alpine AS builder

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV DATABASE_URL="postgresql://mattress:mattress@localhost:5432/mattress?schema=public"

RUN corepack enable
RUN apk add --no-cache openssl

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --filter @mattress/backend... --frozen-lockfile || pnpm install --filter @mattress/backend...

COPY . .

RUN pnpm --filter @mattress/backend db:generate
RUN pnpm --filter @mattress/backend build

EXPOSE 4000

CMD ["pnpm", "--filter", "@mattress/backend", "start:prod"]
