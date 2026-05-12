// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { generateMatchingSchema, appendMatchingRoundsSchema, updateFixedPairsSchema, updateMatchingRoundSchema, updateMemberLevelSchema, updateVisitorLevelSchema } from '../../../src/api/schemas/index.js'
import { MatchingResultSchema, ListParticipantLevelsResponseSchema, ListCategoryMatchFormatsResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/schedules/{id}/matching': {
    get: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(MatchingResultSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(generateMatchingSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    delete: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/matching/participant-levels': {
    get: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListParticipantLevelsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/schedules/{id}/matching/append-rounds': {
    post: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(appendMatchingRoundsSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/matching/fixed-pairs': {
    patch: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateFixedPairsSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/matching/rounds/{roundNo}': {
    patch: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateMatchingRoundSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{communityId}/category-match-formats': {
    get: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListCategoryMatchFormatsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{communityId}/members/{userId}/level': {
    patch: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateMemberLevelSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/participations/{participationId}/visitor-level': {
    patch: {
      tags: ['matching'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateVisitorLevelSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
}
