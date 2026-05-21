// @ts-nocheck
import { supabase } from './supabase';
import { ensureProfileUniqueCode } from './uniqueCode';

export const ROLE_ADMIN = '관리자';
export const ROLE_MEMBER = '회원';
export const ADMIN_LOGIN_ID = 'admin';

const KEYS = {
  role: 'mochi_role',
  loginId: 'mochi_userId',
  nickname: 'mochi_nickname',
  uuid: 'mochi_uuid',
  uniqueCode: 'mochi_unique_code',
};

export function getLoginIdFromEmail(email?: string | null): string {
  return email?.split('@')[0] || '';
}

export function normalizeRole(profileRole?: string | null, loginId?: string): string {
  if (loginId === ADMIN_LOGIN_ID) return ROLE_ADMIN;
  const r = (profileRole || '').trim();
  if (r === ROLE_ADMIN || r === 'admin' || r === 'ADMIN') return ROLE_ADMIN;
  return ROLE_MEMBER;
}

export function isAdminRole(role?: string | null): boolean {
  return role === ROLE_ADMIN;
}

export function getStoredSession() {
  return {
    role: localStorage.getItem(KEYS.role) || ROLE_MEMBER,
    loginId: localStorage.getItem(KEYS.loginId) || '',
    nickname: localStorage.getItem(KEYS.nickname) || '',
    uuid: localStorage.getItem(KEYS.uuid) || '',
    uniqueCode: localStorage.getItem(KEYS.uniqueCode) || '',
    isAdmin: isAdminRole(localStorage.getItem(KEYS.role)),
  };
}

function saveSession(session: {
  role: string;
  loginId: string;
  nickname: string;
  uuid: string;
  uniqueCode?: string;
}) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem(KEYS.role, session.role);
  localStorage.setItem(KEYS.loginId, session.loginId);
  localStorage.setItem(KEYS.nickname, session.nickname);
  localStorage.setItem(KEYS.uuid, session.uuid);
  if (session.uniqueCode) localStorage.setItem(KEYS.uniqueCode, session.uniqueCode);
}

export function clearUserSession() {
  localStorage.removeItem('isLoggedIn');
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

/** 로그인 직후 / 앱 진입 시 프로필과 역할 동기화 */
export async function syncUserSession(user: { id: string; email?: string | null }) {
  const loginId = getLoginIdFromEmail(user.email);
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const role = normalizeRole(profile?.role, loginId);
  const nickname = profile?.nickname || (loginId === ADMIN_LOGIN_ID ? '관리자' : loginId);
  const uniqueCode = await ensureProfileUniqueCode(user.id, loginId, profile?.unique_code);

  const upsertPayload = {
    id: user.id,
    nickname,
    role,
    unique_code: uniqueCode,
    updated_at: new Date().toISOString(),
  };

  if (!profile || profile.role !== role || profile.unique_code !== uniqueCode) {
    await supabase.from('profiles').upsert({
      ...upsertPayload,
      avatar_url: profile?.avatar_url || null,
    });
  }

  const session = { role, loginId, nickname, uuid: user.id, uniqueCode };
  saveSession(session);
  return session;
}

export async function refreshUserSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    clearUserSession();
    return getStoredSession();
  }
  return syncUserSession(user);
}
