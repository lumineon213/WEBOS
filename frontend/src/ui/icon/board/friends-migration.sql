-- Supabase SQL Editor에서 실행 (고유코드 + 친구)

-- 고유코드: 16자리 숫자, 유일
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_unique_code_key ON public.profiles (unique_code);

-- 관리자 고유코드 고정
UPDATE public.profiles
SET unique_code = '#0000000000000001'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@mochi.os');

-- 기존 16자리만 저장된 코드에 # 접두사 붙이기
UPDATE public.profiles
SET unique_code = '#' || unique_code
WHERE unique_code IS NOT NULL
  AND unique_code NOT LIKE '#%'
  AND length(regexp_replace(unique_code, '\D', '', 'g')) = 16;

-- DM 채널 구분 (선택)
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS type text DEFAULT 'channel';
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS dm_key text;
CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_dm_key_key ON public.chat_rooms (dm_key) WHERE dm_key IS NOT NULL;

-- 친구 관계
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dm_room_id uuid REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friends_select_own" ON public.friends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "friends_insert_own" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friends_delete_own" ON public.friends FOR DELETE USING (auth.uid() = user_id);
