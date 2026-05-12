// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { addMemberSchema, changeMemberRoleSchema, updateMembershipLevelSchema } from '../../../src/api/schemas/index.js'
import { ListMembersResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{id}/members': {
    post: {
      tags: ['membership'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(addMemberSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    get: {
      tags: ['membership'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListMembersResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{id}/members/{userId}': {
    patch: {
      tags: ['membership'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(changeMemberRoleSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
    delete: {
      tags: ['membership'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{id}/members/{userId}/level': {
    patch: {
      tags: ['membership'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateMembershipLevelSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{id}/members/me': {
    delete: {
      tags: ['membership'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
