// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

// env 속성 에러를 피하기 위해 (import.meta as any)를 사용합니다.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

// ❗ 디버깅을 위해 콘솔에 출력해 보세요.
console.log("Supabase URL:", supabaseUrl);

// 에러 발생을 막기 위해 기본값 ''을 설정합니다.
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
