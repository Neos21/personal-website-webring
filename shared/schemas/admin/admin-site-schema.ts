import { z } from 'zod';

import { refineBanneSize, updateSiteSchema } from '../site-schema';
import { preprocessBooleanNumber } from '../schema-utilities';

export const adminUpdateSiteSchema = updateSiteSchema.omit({ turnstile_token: true }).extend({
  is_self   : z.preprocess(
                preprocessBooleanNumber,
                z.union([z.literal(0), z.literal(1)])
              ),
  is_deleted: z.preprocess(
                preprocessBooleanNumber,
                z.union([z.literal(0), z.literal(1)])
              )
}).superRefine((data, context) => {
  refineBanneSize(data, context);
});
