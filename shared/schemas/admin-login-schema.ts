import z from 'zod';

export const adminPasswordDisplayName = 'パスワード';

export const adminLoginSchema = z.object({
  password        : z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                      z.string({ error: `${adminPasswordDisplayName}に文字列でないデータが入力されています` })
                        .min(1, { error: `${adminPasswordDisplayName}を入力してください` })
                    ),
  turnstile_token : z.preprocess(
                      value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
                      z.string({ error: 'Turnstile 認証を行ってください' })
                        .min(1, { error: 'Turnstile 認証を行ってください' })
                    )
});
