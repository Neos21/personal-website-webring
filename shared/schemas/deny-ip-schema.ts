import z from 'zod';

export const ipDisplayName = 'IP アドレス';

export const newDenyIpSchema = z.object({
  ip: z.preprocess(
    value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
    z.string({ error: `${ipDisplayName}に文字列でないデータが入力されています` })
      .min(1, { error: `${ipDisplayName}を入力してください` })
      .max(45, { error: `${ipDisplayName}は45文字以内で入力してください` })
  )
});
