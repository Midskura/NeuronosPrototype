-- 026_todos.sql
-- Personal to-do list for each user (Dashboard homebase feature)

CREATE TABLE IF NOT EXISTS todos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        TEXT        NOT NULL CHECK (char_length(trim(text)) > 0),
  done        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  done_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS todos_user_id_idx   ON todos(user_id);
CREATE INDEX IF NOT EXISTS todos_user_done_idx ON todos(user_id, done);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own todos"
  ON todos FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
