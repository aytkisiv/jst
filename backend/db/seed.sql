-- Seed data for testing
-- Fixed UUIDs for reproducibility

INSERT INTO users (id, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, user_id, character, level, started_at)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'bro',
  'b1',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO progress (user_id, xp, streak, level)
VALUES ('00000000-0000-0000-0000-000000000001', 50, 2, 'b1')
ON CONFLICT (user_id) DO NOTHING;
