-- Seed: Paxibay-curated music library (CC0 / CC-BY from Internet Archive).
-- These rows have user_id=NULL so they appear to all users via RLS policy.

insert into public.assets (user_id, kind, title, url, mime_type, duration_s, license, attribution, tags) values
(null, 'custom-music',
 'Mindfront — Dark Triad',
 'https://archive.org/download/mindfront-dark-triad/Mindfront_-_Dark_Triad.mp3',
 'audio/mpeg', 224.04,
 'CC0',
 'Mindfront via Internet Archive',
 array['dramatic','cinematic','horror','dark','soundtrack']),

(null, 'custom-music',
 'Ambient Pad (sample)',
 'https://archive.org/download/audio-ambient-collection-2024/Song_2_3ed88492-7335-4113-a1ba-0a1f71aceea8.mp3',
 'audio/mpeg', 209.78,
 'CC-BY-4.0',
 'Music Archive (CC-BY 4.0)',
 array['ambient','calm','soft','pad']);

-- Add more curated tracks here. Anything with user_id=NULL is library-wide.
