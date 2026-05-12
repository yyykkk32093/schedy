// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { ListNotificationsResponseSchema, UnreadCountResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/notifications': {
    get: {
      tags: ['notification'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListNotificationsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/notifications/unread-count': {
    get: {
      tags: ['notification'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(UnreadCountResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/notifications/{notificationId}/read': {
    patch: {
      tags: ['notification'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/notifications/read-all': {
    patch: {
      tags: ['notification'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
