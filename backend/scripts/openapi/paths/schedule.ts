// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createScheduleSchema, updateScheduleSchema, cancelOrDeleteScheduleSchema } from '../../../src/api/schemas/index.js'
import { CreateScheduleResponseSchema, ListSchedulesResponseSchema, ScheduleListItemSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/activities/{activityId}/schedules': {
    post: {
      tags: ['schedule'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createScheduleSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateScheduleResponseSchema),
            },
          },
        },
      },
    },
    get: {
      tags: ['schedule'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListSchedulesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/schedules/{id}': {
    get: {
      tags: ['schedule'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ScheduleListItemSchema),
            },
          },
        },
      },
    },
    patch: {
      tags: ['schedule'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateScheduleSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/cancel': {
    patch: {
      tags: ['schedule'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/restore': {
    post: {
      tags: ['schedule'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/cancel-or-delete': {
    patch: {
      tags: ['schedule'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(cancelOrDeleteScheduleSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
}
