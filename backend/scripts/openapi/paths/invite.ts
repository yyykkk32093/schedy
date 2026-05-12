// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { GenerateInviteTokenResponseSchema, AcceptInviteResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{id}/invite': {
    post: {
      tags: ['invite'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(GenerateInviteTokenResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/invites/{token}/accept': {
    post: {
      tags: ['invite'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AcceptInviteResponseSchema),
            },
          },
        },
      },
    },
  },
}
