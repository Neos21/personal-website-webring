/** リングマスター向け全項目 */
export type PostAdmin = {
  id: number;
  site_id: number | null;
  user_name: string | null;
  content: string;
  ip: string;
  is_admin: 0 | 1;
  created_at: string;
};

export type PostPublic = Omit<PostAdmin, 'ip'>;

/** `newPostSchema` が入力欄の仕様を定義するのに対して、この型定義は DB 投入時に求める型として示す */
export type NewPost = Pick<PostAdmin, 'site_id' | 'user_name' | 'content' | 'ip' | 'is_admin'>;
