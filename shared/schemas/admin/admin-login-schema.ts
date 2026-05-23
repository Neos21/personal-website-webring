import z from 'zod';

import { preprocessOneLineString, propertyTurnstileToken } from '../schema-utilities';

export const adminPasswordDisplayName = 'パスワード' as const;

export const adminLoginSchema = z.object({
  password        : z.preprocess(
                      preprocessOneLineString,
                      z.string({ error: `${adminPasswordDisplayName}に文字列でないデータが入力されています` })
                        .min(1, { error: `${adminPasswordDisplayName}を入力してください` })
                    ),
  turnstile_token : propertyTurnstileToken
});
