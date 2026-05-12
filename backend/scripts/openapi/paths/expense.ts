// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { createExpenseCategorySchema, createExpenseSchema } from '../../../src/api/schemas/index.js'
import { ListExpenseCategoriesResponseSchema, ListExpensesResponseSchema, ExpenseItemSchema, FinanceSummaryResponseSchema, FinanceSummaryTreeResponseSchema, CommunityIncomeResponseSchema, ActivityIncomeDetailResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/communities/{communityId}/expense-categories': {
    get: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListExpenseCategoriesResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createExpenseCategorySchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{communityId}/expense-categories/{categoryId}': {
    patch: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
    delete: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{communityId}/expenses': {
    get: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListExpensesResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(createExpenseSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ExpenseItemSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{communityId}/expenses/{expenseId}': {
    delete: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{communityId}/finance/summary': {
    get: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(FinanceSummaryResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{communityId}/finance/summary-tree': {
    get: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(FinanceSummaryTreeResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{communityId}/finance/income': {
    get: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CommunityIncomeResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{communityId}/finance/income/activities/{activityId}': {
    get: {
      tags: ['expense'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ActivityIncomeDetailResponseSchema),
            },
          },
        },
      },
    },
  },
}
