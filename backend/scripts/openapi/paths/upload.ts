// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { presignedUrlSchema, uploadConfirmSchema } from '../../../src/api/schemas/index.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/upload/url': {
    post: {
      tags: ['upload'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(presignedUrlSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/upload/confirm': {
    post: {
      tags: ['upload'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(uploadConfirmSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
}
