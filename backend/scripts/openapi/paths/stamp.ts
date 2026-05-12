// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { addReactionSchema } from '../../../src/api/schemas/index.js'
import { ListStampsResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/stamps': {
    get: {
      tags: ['stamp'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListStampsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/stamps/{stampId}': {
    delete: {
      tags: ['stamp'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/messages/{messageId}/reactions': {
    post: {
      tags: ['stamp'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(addReactionSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/messages/{messageId}/reactions/{identifier}': {
    delete: {
      tags: ['stamp'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
