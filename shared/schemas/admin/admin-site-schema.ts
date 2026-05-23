import { z } from 'zod';

import { preprocessBooleanNumber } from '../schema-utilities';
import { refineBannerUrl, refineBanneSize, updateSiteSchemaObject } from '../site-schema';

export const adminUpdateSiteSchema = updateSiteSchemaObject.omit({ turnstile_token: true }).extend({
  is_self   : z.preprocess(
                preprocessBooleanNumber,
                z.union([z.literal(0), z.literal(1)])
              ),
  is_deleted: z.preprocess(
                preprocessBooleanNumber,
                z.union([z.literal(0), z.literal(1)])
              )
}).superRefine((data, context) => {
  refineBannerUrl(data, context);
  refineBanneSize(data, context);
});
