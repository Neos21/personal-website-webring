import type { PostAdmin } from './admin/admin-post';

export type PostPublic = Omit<PostAdmin, 'ip'>;

export type NewPost = Pick<PostAdmin, 'site_id' | 'user_name' | 'content' | 'ip' | 'is_admin'>;
