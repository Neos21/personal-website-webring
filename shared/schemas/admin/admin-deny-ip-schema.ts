import z from 'zod';

import { preprocessUrl } from '../schema-utilities';

export const ipDisplayName = 'IP アドレス' as const;

export const adminNewDenyIpSchema = z.object({
  ip: z.preprocess(
        preprocessUrl,
        z.string({ error: `${ipDisplayName}に文字列でないデータが入力されています` })
          .min(1, { error: `${ipDisplayName}を入力してください` })
      )
});
