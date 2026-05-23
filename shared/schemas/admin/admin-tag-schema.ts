import z from 'zod';

import { tagNameSchema } from '../tag-schema';

export const adminNewOrUpdateTagSchema = z.object({
  name: tagNameSchema
});
