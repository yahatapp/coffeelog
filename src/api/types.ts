export type Env = {
  Bindings: {
    DATABASE_URL: string;
    LINE_CHANNEL_ID: string;
    ALLOWED_LINE_USER_IDS: string;
  };
  Variables: {
    lineUserId: string;
  };
};
