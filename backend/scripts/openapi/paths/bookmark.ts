// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { BookmarkedCommunitiesResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{id}/bookmarks': {
    post: {
      tags: ['bookmark'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
    delete: {
      tags: ['bookmark'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/bookmarks/communities': {
    get: {
      tags: ['bookmark'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(BookmarkedCommunitiesResponseSchema),
            },
          },
        },
      },
    },
  },
}
