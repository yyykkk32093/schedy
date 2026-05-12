// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createActivitySchema, updateActivitySchema, changeOrganizerSchema, deleteActivitySchema } from '../../../src/api/schemas/index.js'
import { CreateActivityResponseSchema, ListActivitiesResponseSchema, ActivityDetailSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{communityId}/activities': {
    post: {
      tags: ['activity'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createActivitySchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateActivityResponseSchema),
            },
          },
        },
      },
    },
    get: {
      tags: ['activity'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListActivitiesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/activities/{id}': {
    get: {
      tags: ['activity'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ActivityDetailSchema),
            },
          },
        },
      },
    },
    patch: {
      tags: ['activity'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateActivitySchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    delete: {
      tags: ['activity'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(deleteActivitySchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/activities/{id}/organizer': {
    patch: {
      tags: ['activity'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(changeOrganizerSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
}
