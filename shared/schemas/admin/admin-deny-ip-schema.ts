import z from 'zod';

import { preprocessOneLineString } from '../schema-utilities';

export const ipDisplayName = 'IP' as const;

export const adminNewDenyIpSchema = z.object({
  ip: z.preprocess(
        preprocessOneLineString,
        z.string({ error: `${ipDisplayName} に文字列でないデータが入力されています` })
          .min(1, { error: `${ipDisplayName} を入力してください` })
      )
});
