// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run `pnpm generate:openapi` to regenerate

import { z } from 'zod/v4'
import { ListUserSchedulesResponseSchema } from '../../../src/api/schemas/responseSchemas.js'

export const paths: Record<string, Record<string, unknown>> = {
  '/v1/users/me/schedules': {
    get: {
      tags: ['user-schedule'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'OK',
          content: {
            'application/json': {
              schema: z.toJSONSchema(ListUserSchedulesResponseSchema),
            },
          },
        },
      },
    },
  },
}
