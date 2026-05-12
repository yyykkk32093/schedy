// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { sendMessageSchema } from '../../../src/api/schemas/index.js'
import { ChatChannelSchema, SearchMessagesResponseSchema, ListMessagesResponseSchema, SendMessageResponseSchema, CommunityChannelTreeResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{communityId}/channel': {
    get: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ChatChannelSchema),
            },
          },
        },
      },
    },
  },
  '/v1/activities/{activityId}/channel': {
    get: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ChatChannelSchema),
            },
          },
        },
      },
    },
  },
  '/v1/channels/{channelId}/messages/search': {
    get: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(SearchMessagesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/channels/{channelId}/messages': {
    get: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListMessagesResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(sendMessageSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(SendMessageResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/messages/{messageId}/replies': {
    get: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListMessagesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/messages/{messageId}': {
    delete: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/channels/community-tree': {
    get: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CommunityChannelTreeResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/channels/{channelId}/read': {
    put: {
      tags: ['chat'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
