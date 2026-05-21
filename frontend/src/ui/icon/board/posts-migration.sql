-- Supabase SQL Editor에서 실행하세요 (게시판 사진 기능)

-- 이미지 URL (목록 썸네일용)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url text;

-- 여러 장 JSON 배열 ["url1","url2"] 또는 base64
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images text;

-- Storage 버킷 (선택, 없으면 base64로 저장됨)
-- Dashboard > Storage > New bucket: post-images, Public: true
