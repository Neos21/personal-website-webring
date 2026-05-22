import z from 'zod';

export const tagNameDisplayName = 'タグ名';

export const newTagSchema = z.object({
  name: z.preprocess(
    value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
    z.string({ error: `${tagNameDisplayName}に文字列でないデータが入力されています` })
      .min(1, { error: `${tagNameDisplayName}を入力してください` })
      .max(50, { error: `${tagNameDisplayName}は50文字以内で入力してください` })
  )
});
