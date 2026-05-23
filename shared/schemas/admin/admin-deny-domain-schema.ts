import z from 'zod';

import { preprocessUrl } from '../schema-utilities';

export const domainDisplayName = 'ドメイン' as const;
export const domainMaxLength   = 255        as const;

export const adminNewDenyDomainSchema = z.object({
  domain: z.preprocess(
            preprocessUrl,
            z.string({ error: `${domainDisplayName}に文字列でないデータが入力されています` })
              .min(1, { error: `${domainDisplayName}を入力してください` })
              .max(domainMaxLength, { error: `${domainDisplayName}は${domainMaxLength}文字以内で入力してください` })
          )
});
