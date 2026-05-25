-- just to study — database schema
-- snake_case, UUID PKs, FK indexes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character  VARCHAR(32) NOT NULL,
  level      VARCHAR(8)  NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role       VARCHAR(16) NOT NULL,
  content    TEXT        NOT NULL,
  mood       VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);

CREATE TABLE progress (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  xp         INT  NOT NULL DEFAULT 0,
  streak     INT  NOT NULL DEFAULT 0,
  level      VARCHAR(8),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(64) NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_type)
);

CREATE INDEX idx_badges_user_id ON badges(user_id);

-- Tracks which messages have already granted XP (idempotency key)
CREATE TABLE xp_events (
  message_id UUID PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INT  NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
