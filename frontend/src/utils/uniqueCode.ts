// @ts-nocheck
import { supabase } from './supabase';
import { ADMIN_LOGIN_ID } from './auth';

export const UNIQUE_CODE_PREFIX = '#';
export const UNIQUE_CODE_LENGTH = 16;
export const ADMIN_CODE_DIGITS = '0000000000000001';
export const ADMIN_UNIQUE_CODE = `${UNIQUE_CODE_PREFIX}${ADMIN_CODE_DIGITS}`;

/** 숫자 16자리만 추출 */
export function extractUniqueCodeDigits(input?: string | null): string {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (digits.length >= UNIQUE_CODE_LENGTH) {
    return digits.slice(0, UNIQUE_CODE_LENGTH);
  }
  return digits.padStart(UNIQUE_CODE_LENGTH, '0');
}

/** 저장·표시용: # + 16자리 */
export function formatUniqueCode(input?: string | null): string {
  const digits = extractUniqueCodeDigits(input);
  if (digits.length !== UNIQUE_CODE_LENGTH) return '';
  return `${UNIQUE_CODE_PREFIX}${digits}`;
}

/** @deprecated — formatUniqueCode 사용 */
export function normalizeUniqueCodeInput(input?: string | null): string {
  return extractUniqueCodeDigits(input);
}

export function isValidUniqueCode(code?: string | null): boolean {
  return extractUniqueCodeDigits(code).length === UNIQUE_CODE_LENGTH;
}

/** 랜덤 16자리 숫자 (관리자 번호 제외) */
export function generateRandomUniqueCodeDigits(): string {
  let code = '';
  for (let i = 0; i < UNIQUE_CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  if (code === ADMIN_CODE_DIGITS) return generateRandomUniqueCodeDigits();
  return code;
}

async function isCodeTaken(formattedCode: string, excludeUserId?: string): Promise<boolean> {
  const digits = extractUniqueCodeDigits(formattedCode);
  const withHash = formatUniqueCode(digits);

  let q1 = supabase.from('profiles').select('id').eq('unique_code', withHash);
  if (excludeUserId) q1 = q1.neq('id', excludeUserId);
  const { data: d1 } = await q1.maybeSingle();
  if (d1) return true;

  let q2 = supabase.from('profiles').select('id').eq('unique_code', digits);
  if (excludeUserId) q2 = q2.neq('id', excludeUserId);
  const { data: d2 } = await q2.maybeSingle();
  return !!d2;
}

export async function resolveUniqueCodeForUser(
  loginId: string,
  existingCode?: string | null,
  userId?: string
): Promise<string> {
  if (loginId === ADMIN_LOGIN_ID) {
    return ADMIN_UNIQUE_CODE;
  }

  const digits = extractUniqueCodeDigits(existingCode);
  const formatted = formatUniqueCode(digits);
  if (
    isValidUniqueCode(digits) &&
    digits !== ADMIN_CODE_DIGITS &&
    !(await isCodeTaken(formatted, userId))
  ) {
    return formatted;
  }

  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = formatUniqueCode(generateRandomUniqueCodeDigits());
    if (!(await isCodeTaken(candidate))) return candidate;
  }

  throw new Error('고유코드를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
}

export async function ensureProfileUniqueCode(
  userId: string,
  loginId: string,
  existingCode?: string | null
): Promise<string> {
  const existingDigits = extractUniqueCodeDigits(existingCode);
  const existingFormatted = formatUniqueCode(existingCode);

  const needNew =
    !existingCode ||
    !isValidUniqueCode(existingCode) ||
    (loginId === ADMIN_LOGIN_ID && existingDigits !== ADMIN_CODE_DIGITS) ||
    (loginId !== ADMIN_LOGIN_ID && existingDigits === ADMIN_CODE_DIGITS) ||
    (existingFormatted && !existingFormatted.startsWith(UNIQUE_CODE_PREFIX));

  const code = needNew
    ? await resolveUniqueCodeForUser(loginId, existingCode, userId)
    : formatUniqueCode(existingCode);

  if (needNew || formatUniqueCode(existingCode) !== code) {
    await supabase.from('profiles').update({ unique_code: code }).eq('id', userId);
  }

  return code;
}

export async function findProfileByUniqueCode(codeInput: string) {
  const formatted = formatUniqueCode(codeInput);
  const digits = extractUniqueCodeDigits(codeInput);
  if (!isValidUniqueCode(digits)) {
    return { profile: null, error: `${UNIQUE_CODE_PREFIX} 포함 16자리 숫자 고유코드를 입력해주세요.` };
  }

  let { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, unique_code, role')
    .eq('unique_code', formatted)
    .maybeSingle();

  if (!data && !error) {
    const legacy = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, unique_code, role')
      .eq('unique_code', digits)
      .maybeSingle();
    data = legacy.data;
    error = legacy.error;
  }

  if (error) return { profile: null, error: error.message };
  if (!data) return { profile: null, error: '해당 고유코드의 사용자를 찾을 수 없습니다.' };
  return { profile: data, error: null };
}
