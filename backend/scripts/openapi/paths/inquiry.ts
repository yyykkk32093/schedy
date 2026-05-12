// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { ListInquiryCategoriesResponseSchema, ListAdminInquiriesResponseSchema, AdminInquiryDetailResponseSchema, InquiryMessageDtoSchema, ListSystemAdminsResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/inquiries/categories': {
    get: {
      tags: ['inquiry'],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListInquiryCategoriesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/inquiries/anonymous': {
    post: {
      tags: ['inquiry'],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/admin/inquiries': {
    get: {
      tags: ['inquiry'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListAdminInquiriesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/admin/inquiries/{id}': {
    get: {
      tags: ['inquiry'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AdminInquiryDetailResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/admin/inquiries/{id}/status': {
    patch: {
      tags: ['inquiry'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/admin/inquiries/{id}/messages': {
    post: {
      tags: ['inquiry'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(InquiryMessageDtoSchema),
            },
          },
        },
      },
    },
  },
  '/v1/admin/inquiries/{id}/assignee': {
    patch: {
      tags: ['inquiry'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/admin/system-admins': {
    get: {
      tags: ['inquiry'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListSystemAdminsResponseSchema),
            },
          },
        },
      },
    },
  },
}
