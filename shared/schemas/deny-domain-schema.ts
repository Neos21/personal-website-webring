import z from 'zod';

export const domainDisplayName = 'ドメイン';

export const newDenyDomainSchema = z.object({
  domain: z.preprocess(
            value => value == null ? '' : typeof value === 'string' ? value.trim() : value,
            z.string({ error: `${domainDisplayName}に文字列でないデータが入力されています` })
              .min(1, { error: `${domainDisplayName}を入力してください` })
              .max(255, { error: `${domainDisplayName}は255文字以内で入力してください` })
          )
});
