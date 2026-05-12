// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/webhooks/revenuecat': {
    post: {
      tags: ['billing-webhook'],
      responses: { 200: { description: 'OK' } },
    },
  },
}
