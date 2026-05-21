export type Post = {
  id: number;
  site_id: number | null;
  user_name: string | null;
  content: string;
  ip: string;
  is_admin: number;
  created_at: string;
};

export type PostPublic = Omit<Post, 'ip'>;

export type NewPost = Pick<Post, 'site_id' | 'user_name' | 'content' | 'ip' | 'is_admin'>;
