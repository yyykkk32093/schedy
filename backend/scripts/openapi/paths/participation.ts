// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { attendScheduleSchema, joinWaitlistSchema, bulkConfirmPaymentsSchema, bulkUpdatePaymentsSchema, addGuestVisitorSchema, addRegisteredVisitorSchema, updateVisitorPaymentSchema } from '../../../src/api/schemas/index.js'
import { ListParticipantsResponseSchema, AttendScheduleResponseSchema, GetParticipationHistoryResponseSchema, ListWaitlistResponseSchema, JoinWaitlistResponseSchema, CreateCreditCardPaymentIntentResponseSchema, ListRefundPendingResponseSchema, ListPaymentHistoryResponseSchema, AddVisitorResponseSchema, VisitorNamesResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/schedules/{id}/participations': {
    get: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListParticipantsResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(attendScheduleSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AttendScheduleResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/schedules/{id}/participations/me': {
    delete: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/participations/me/history': {
    get: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(GetParticipationHistoryResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/schedules/{id}/waitlist-entries': {
    get: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListWaitlistResponseSchema),
            },
          },
        },
      },
    },
    post: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(joinWaitlistSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(JoinWaitlistResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/schedules/{id}/waitlist-entries/me': {
    delete: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/participations/{participationId}/report-payment': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/participations/{participationId}/confirm-payment': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/payments/bulk-confirm': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(bulkConfirmPaymentsSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/payments/bulk': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(bulkUpdatePaymentsSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/participations/me/stripe-payment-intent': {
    post: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(CreateCreditCardPaymentIntentResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/schedules/{id}/participations/{userId}': {
    delete: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/participations/{participationId}': {
    delete: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/payments/refund-pending': {
    get: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListRefundPendingResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{id}/payments/refund-pending': {
    get: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListRefundPendingResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/communities/{id}/payments/resolved': {
    get: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListPaymentHistoryResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/payments/{paymentId}/mark-refunded': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/payments/{paymentId}/mark-no-refund': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/payments/{paymentId}/revert-refund': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/schedules/{id}/guest-visitors': {
    post: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(addGuestVisitorSchema),
          },
        },
      },
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(AddVisitorResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/schedules/{id}/registered-visitors': {
    post: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(addRegisteredVisitorSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/communities/{communityId}/visitor-names': {
    get: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(VisitorNamesResponseSchema),
            },
          },
        },
      },
    },
  },
  '/v1/participations/{participationId}/visitor-payment': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.toJSONSchema(updateVisitorPaymentSchema),
          },
        },
      },
      responses: { 200: { description: 'OK' } },
    },
  },
  '/v1/participations/{participationId}/select-payment-method': {
    patch: {
      tags: ['participation'],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'OK' } },
    },
  },
}
