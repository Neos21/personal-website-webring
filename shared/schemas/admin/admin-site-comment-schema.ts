import { newSiteCommentSchema } from '../site-comment-schema';

export const adminUpdateSiteCommentSchema = newSiteCommentSchema.omit({ turnstile_token: true });
