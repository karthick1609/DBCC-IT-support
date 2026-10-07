DELETE FROM users
WHERE (auth_user_id, email) IN (
  ('00000000-0000-0000-0000-000000000001'::uuid, 'admin@example.com'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'staff@example.com'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'principal@example.com')
);
