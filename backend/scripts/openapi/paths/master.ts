// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { ListCategoriesResponseSchema, ListParticipationLevelsResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/categories': {
    get: {
      tags: ['master'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListCategoriesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/participation-levels': {
    get: {
      tags: ['master'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListParticipationLevelsResponseSchema),
            },
          },
        },
      },
    },
  },
}
