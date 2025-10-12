-- Add sample achievements to the database
INSERT INTO public.achievements (id, code, name, description, category, icon_name, points, created_at)
VALUES 
  ('82f3fcb9-2943-407b-b022-af3461b51fb6', 'first_catch', 'First Catch', 'Log your first marine animal', 'beginner', 'Trophy', 20, '2025-03-15 14:27:09.769371+00'),
  ('ef637313-e774-4c4d-bd1c-623eacccf5de', 'manta_mania', 'Manta Mania', 'Log a manta ray', 'rare', 'Fish', 75, '2025-03-15 14:27:09.769371+00'),
  ('942132e2-bb7a-4a14-a260-5a2022df8918', 'dolphin_friend', 'Dolphin Friend', 'Log any species of dolphin', 'rare', 'Heart', 75, '2025-03-15 14:27:09.769371+00'),
  ('1c8e4112-4a3f-4639-afe5-c8d0563ce9f5', 'getting_feet_wet', 'Getting Your Feet Wet', 'Log 5 different species', 'beginner', 'Fish', 50, '2025-03-15 14:27:09.769371+00'),
  ('39f92a8b-bf37-4060-8e1f-7c397b69e0b9', 'underwater_explorer', 'Underwater Explorer', 'Log 10 different species', 'beginner', 'Trophy', 50, '2025-03-15 14:27:09.769371+00'),
  ('c7746aaa-91df-43cf-939a-5f258103366a', 'marine_enthusiast', 'Marine Enthusiast', 'Log 25 different species', 'collection', 'Medal', 100, '2025-03-15 14:27:09.769371+00'),
  ('a7682fc3-8d25-4dbe-815a-ada53d69e0b0', 'ocean_archivist', 'Ocean Archivist', 'Log 50 different species', 'collection', 'Medal', 200, '2025-03-15 14:27:09.769371+00'),
  ('525cad23-c51a-4d49-bbb0-e6797136d0cd', 'sea_vault_master', 'Sea Vault Master', 'Log 100 different species', 'collection', 'Medal', 500, '2025-03-15 14:27:09.769371+00'),
  ('5c243d26-5f6b-4e15-9eaf-f38b00776175', 'shark_whisperer', 'Shark Whisperer', 'Log any species of shark', 'rare', 'Swords', 75, '2025-03-15 14:27:09.769371+00'),
  ('7c06c6fc-d919-4b22-b64f-b03b6e36b5c9', 'elusive_spotter', 'Elusive Spotter', 'Log a rare species', 'rare', 'Star', 100, '2025-03-15 14:27:09.769371+00'),
  ('960c4f46-87f9-4b18-b844-7fd0b172cb58', 'whale_watcher', 'Whale Watcher', 'Log any whale species', 'rare', 'Whale', 100, '2025-03-15 14:27:09.769371+00')
ON CONFLICT (id) DO NOTHING;