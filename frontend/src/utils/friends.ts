// @ts-nocheck
import { supabase } from './supabase';
import { findProfileByUniqueCode, formatUniqueCode, extractUniqueCodeDigits } from './uniqueCode';

function dmRoomName(nickname: string, code: string) {
  return `DM · ${nickname} (${code.slice(-4)})`;
}

function sortedPair(a: string, b: string) {
  return [a, b].sort();
}

/** DM 채팅방 생성 또는 조회 */
export async function getOrCreateDmRoom(myId: string, friendId: string, friendProfile: { nickname: string; unique_code?: string }) {
  const [a, b] = sortedPair(myId, friendId);
  const dmKey = `${a}_${b}`;
  const name = dmRoomName(friendProfile.nickname || '친구', extractUniqueCodeDigits(friendProfile.unique_code) || '0000');

  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('dm_key', dmKey)
    .maybeSingle();

  if (existing) return { room: existing, error: null };

  const payload = { name, created_by: myId, type: 'dm', dm_key: dmKey };
  let { data: created, error } = await supabase.from('chat_rooms').insert([payload]).select().single();

  if (error) {
    const fallback = await supabase
      .from('chat_rooms')
      .insert([{ name: `DM-${dmKey.slice(0, 12)}`, created_by: myId }])
      .select()
      .single();
    created = fallback.data;
    error = fallback.error;
  }

  return { room: created, error: error?.message || null };
}

/** 친구 목록 (profiles 조인) */
export async function fetchFriends(userId: string) {
  const { data: rows, error } = await supabase
    .from('friends')
    .select('id, friend_id, dm_room_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !rows?.length) return { friends: [], error: error?.message };

  const friendIds = rows.map((r) => r.friend_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, unique_code')
    .in('id', friendIds);

  const profileMap = {};
  (profiles || []).forEach((p) => { profileMap[p.id] = p; });

  const friends = rows.map((r) => ({
    ...r,
    profile: profileMap[r.friend_id] || { id: r.friend_id, nickname: '알 수 없음' },
  }));

  return { friends, error: null };
}

/** 고유코드로 친구 추가 */
export async function addFriendByCode(myId: string, codeInput: string) {
  const code = formatUniqueCode(codeInput);
  const { profile, error: findErr } = await findProfileByUniqueCode(code);
  if (findErr || !profile) return { ok: false, error: findErr || '사용자를 찾을 수 없습니다.' };
  if (profile.id === myId) return { ok: false, error: '본인은 친구로 추가할 수 없습니다.' };

  const { data: dup } = await supabase
    .from('friends')
    .select('id')
    .eq('user_id', myId)
    .eq('friend_id', profile.id)
    .maybeSingle();

  if (dup) return { ok: false, error: '이미 친구로 등록된 사용자입니다.' };

  const { room, error: roomErr } = await getOrCreateDmRoom(myId, profile.id, profile);
  if (roomErr || !room) return { ok: false, error: roomErr || 'DM 방 생성에 실패했습니다.' };

  const { error: insertErr } = await supabase.from('friends').insert([
    {
      user_id: myId,
      friend_id: profile.id,
      dm_room_id: room.id,
    },
  ]);

  if (insertErr) {
    if (insertErr.message?.includes('friends') || insertErr.code === '42P01') {
      return { ok: false, error: 'friends 테이블이 없습니다. Supabase에서 friends-migration.sql을 실행해주세요.' };
    }
    return { ok: false, error: insertErr.message };
  }

  return { ok: true, friend: profile, room, error: null };
}
