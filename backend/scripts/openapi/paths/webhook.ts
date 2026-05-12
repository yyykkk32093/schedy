// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { saveWebhookConfigSchema } from '../../../src/api/schemas/index.js'
import { ListWebhookConfigsResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{communityId}/webhooks': {
    put: {
      tags: ['webhook'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(saveWebhookConfigSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    get: {
      tags: ['webhook'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListWebhookConfigsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{communityId}/webhooks/{configId}': {
    delete: {
      tags: ['webhook'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
