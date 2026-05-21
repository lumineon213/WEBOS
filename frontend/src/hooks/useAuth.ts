// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { getStoredSession, refreshUserSession, isAdminRole } from '../utils/auth';

export function useAuth() {
  const [session, setSession] = useState(getStoredSession);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await refreshUserSession();
    setSession({
      ...next,
      uniqueCode: next.uniqueCode || '',
      isAdmin: isAdminRole(next.role),
    });
    return next;
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return {
    role: session.role,
    loginId: session.loginId,
    nickname: session.nickname,
    uuid: session.uuid,
    uniqueCode: session.uniqueCode || '',
    isAdmin: session.isAdmin ?? isAdminRole(session.role),
    loading,
    refresh,
  };
}
