#!/usr/bin/env sh
set -eu

pnpm --filter @mattress/backend db:seed
