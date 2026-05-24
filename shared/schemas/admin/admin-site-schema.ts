import { z } from 'zod';

import { preprocessBooleanNumber, preprocessOneLineString } from '../schema-utilities';
import { passwordDisplayName, passwordMaxLength, refineBannerUrl, refineBanneSize, updateSiteSchemaObject } from '../site-schema';

export const adminUpdateSiteSchema = updateSiteSchemaObject.omit({ password: true, turnstile_token: true }).extend({
  is_self   : z.preprocess(
                preprocessBooleanNumber,
                z.union([z.literal(0), z.literal(1)])
              ),
  password  : z.preprocess(
                preprocessOneLineString,
                z.string({ error: `${passwordDisplayName}に文字列でないデータが入力されています` })
                  .max(passwordMaxLength, { error: `${passwordDisplayName}は${passwordMaxLength}文字以内で入力してください` })
                  .nullish()
              ),
  is_deleted: z.preprocess(
                preprocessBooleanNumber,
                z.union([z.literal(0), z.literal(1)])
              )
}).superRefine((data, context) => {
  refineBannerUrl(data, context);
  refineBanneSize(data, context);
});
