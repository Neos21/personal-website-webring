export type HonoBindings = {
  DB: D1Database;
  
  /** Turnstile シークレットキー */
  TURNSTILE_SECRET_KEY: string;
  /** リングマスターの管理画面にログインするためのパスワード */
  ADMIN_PASSWORD: string;
  /** リングマスターの管理画面で使用する JWT シークレット */
  ADMIN_JWT_SECRET: string;
};
