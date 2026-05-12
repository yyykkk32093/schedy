// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { signUpSchema, updateUserProfileSchema, deleteUserSchema } from '../../../src/api/schemas/index.js'
import { SignUpResponseSchema, UserProfileSchema, UserLocaleResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/users': {
    post: {
      tags: ['user'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(signUpSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(SignUpResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/users/me/profile': {
    get: {
      tags: ['user'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(UserProfileSchema),
            },
          },
        },
      },
    },
  },
  '/v1/users/me': {
    patch: {
      tags: ['user'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateUserProfileSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    delete: {
      tags: ['user'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(deleteUserSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/users/me/locale': {
    get: {
      tags: ['user'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(UserLocaleResponseSchema),
            },
          },
        },
      },
    },
    patch: {
      tags: ['user'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
