// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createSessionSchema } from '../../../src/api/schemas/index.js'
import { PasswordLoginResponseSchema, LogoutResponseSchema, AuthMeResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/auth/sessions': {
    post: {
      tags: ['session'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createSessionSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(PasswordLoginResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/auth/logout': {
    post: {
      tags: ['session'],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(LogoutResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/auth/me': {
    get: {
      tags: ['session'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AuthMeResponseSchema),
            },
          },
        },
      },
    },
  },
}
