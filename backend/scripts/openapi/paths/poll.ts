// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createPollSchema, votePollSchema } from '../../../src/api/schemas/index.js'
import { ListPollsResponseSchema, PollResultSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{communityId}/polls': {
    post: {
      tags: ['poll'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createPollSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    get: {
      tags: ['poll'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListPollsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/polls/{id}': {
    get: {
      tags: ['poll'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(PollResultSchema),
            },
          },
        },
      },
    },
    delete: {
      tags: ['poll'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/polls/{id}/vote': {
    post: {
      tags: ['poll'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(votePollSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
}
