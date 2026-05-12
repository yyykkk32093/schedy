// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createAnnouncementSchema, updateAnnouncementSchema, createCommentSchema } from '../../../src/api/schemas/index.js'
import { AnnouncementFeedResponseSchema, SearchAnnouncementsResponseSchema, CreateAnnouncementResponseSchema, ListAnnouncementsResponseSchema, AnnouncementDetailSchema, UpdateAnnouncementResponseSchema, ToggleLikeResponseSchema, ToggleBookmarkResponseSchema, ListCommentsResponseSchema, CreateCommentResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/announcements/feed': {
    get: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AnnouncementFeedResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/announcements/search': {
    get: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(SearchAnnouncementsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{communityId}/announcements': {
    post: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createAnnouncementSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateAnnouncementResponseSchema),
            },
          },
        },
      },
    },
    get: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListAnnouncementsResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/announcements/{id}': {
    get: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AnnouncementDetailSchema),
            },
          },
        },
      },
    },
    patch: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateAnnouncementSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(UpdateAnnouncementResponseSchema),
            },
          },
        },
      },
    },
    delete: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/announcements/{id}/reads': {
    post: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/announcements/{id}/likes': {
    post: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ToggleLikeResponseSchema),
            },
          },
        },
      },
    },
    delete: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ToggleLikeResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/announcements/{id}/bookmarks': {
    post: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ToggleBookmarkResponseSchema),
            },
          },
        },
      },
    },
    delete: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ToggleBookmarkResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/announcements/{id}/comments': {
    get: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListCommentsResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createCommentSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateCommentResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/announcements/{id}/comments/{commentId}': {
    delete: {
      tags: ['announcement'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
