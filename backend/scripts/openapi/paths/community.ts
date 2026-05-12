// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createCommunitySchema, createSubCommunitySchema, updateCommunitySchema, joinRequestSchema } from '../../../src/api/schemas/index.js'
import { SearchCommunitiesResponseSchema, CommunityDetailSchema, CreateCommunityResponseSchema, ListCommunitiesResponseSchema, JoinCommunityResponseSchema, JoinRequestResponseSchema, ListSubCommunitiesResponseSchema, ListAuditLogsResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/search': {
    get: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(SearchCommunitiesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/public/{id}': {
    get: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CommunityDetailSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities': {
    post: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createCommunitySchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateCommunityResponseSchema),
            },
          },
        },
      },
    },
    get: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListCommunitiesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{parentId}/children': {
    post: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createSubCommunitySchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateCommunityResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{id}': {
    get: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CommunityDetailSchema),
            },
          },
        },
      },
    },
    patch: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateCommunitySchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    delete: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{id}/join': {
    post: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(JoinCommunityResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{id}/join-request': {
    post: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(joinRequestSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(JoinRequestResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{id}/children': {
    get: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListSubCommunitiesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{id}/audit-logs': {
    get: {
      tags: ['community'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListAuditLogsResponseSchema),
            },
          },
        },
      },
    },
  },
}
