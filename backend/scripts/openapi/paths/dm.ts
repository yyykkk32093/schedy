// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createDMSchema } from '../../../src/api/schemas/index.js'
import { ListDmChannelsResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/dm/channels': {
    post: {
      tags: ['dm'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createDMSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    get: {
      tags: ['dm'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListDmChannelsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/dm/channels/{channelId}/leave': {
    delete: {
      tags: ['dm'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
