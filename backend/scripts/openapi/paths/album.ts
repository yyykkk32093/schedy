// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createAlbumSchema, addAlbumPhotoSchema } from '../../../src/api/schemas/index.js'
import { ListAlbumsResponseSchema, CreateAlbumResponseSchema, ListAlbumPhotosResponseSchema, AddAlbumPhotoResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{communityId}/albums': {
    get: {
      tags: ['album'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListAlbumsResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['album'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createAlbumSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateAlbumResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/albums/{albumId}/photos': {
    get: {
      tags: ['album'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListAlbumPhotosResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['album'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(addAlbumPhotoSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AddAlbumPhotoResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/albums/{albumId}/photos/{photoId}': {
    delete: {
      tags: ['album'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
