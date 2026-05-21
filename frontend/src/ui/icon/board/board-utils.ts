// @ts-nocheck
import { supabase } from '../../../utils/supabase';
import { formatUniqueCode, extractUniqueCodeDigits } from '../../../utils/uniqueCode';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 4;

export function parsePostImages(post: { images?: string | string[]; image_url?: string }): string[] {
  if (!post) return [];
  if (post.images) {
    try {
      const parsed = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
      if (Array.isArray(parsed)) return parsed.filter(Boolean).slice(0, MAX_IMAGES);
    } catch { /* ignore */ }
  }
  if (post.image_url) return [post.image_url];
  return [];
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function authorHandle(profile: { unique_code?: string; nickname?: string }, fallbackAuthor?: string): string {
  if (profile?.unique_code) {
    const digits = extractUniqueCodeDigits(profile.unique_code);
    return digits ? `@${digits}` : formatUniqueCode(profile.unique_code);
  }
  const name = profile?.nickname || fallbackAuthor || 'user';
  return `@${name.replace(/\s/g, '').toLowerCase().slice(0, 15)}`;
}

export async function uploadPostImage(file: File, userId: string): Promise<string | null> {
  if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE) return null;
  const path = `${userId}/${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
  const { error } = await supabase.storage.from('post-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (!error) {
    const { data } = supabase.storage.from('post-images').getPublicUrl(path);
    return data.publicUrl;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadPostImages(files: File[], userId: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files.filter((f) => f.type.startsWith('image/')).slice(0, MAX_IMAGES)) {
    const url = await uploadPostImage(file, userId);
    if (url) urls.push(url);
  }
  return urls;
}

export function validateImageFiles(files: FileList | File[]): string | null {
  const list = Array.from(files);
  if (list.length > MAX_IMAGES) return `이미지는 최대 ${MAX_IMAGES}장까지입니다.`;
  for (const f of list) {
    if (!f.type.startsWith('image/')) return '이미지만 업로드할 수 있습니다.';
    if (f.size > MAX_IMAGE_SIZE) return `${f.name}은(는) 5MB를 초과합니다.`;
  }
  return null;
}

export function isTopLevelPost(post: { parent_id?: number | null }) {
  return post.parent_id == null || post.parent_id === undefined;
}

/** 타임라인용 게시글 + 프로필 + 좋아요/답글 수 */
export async function fetchTimelinePosts(userId: string) {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return { posts: [], error: error.message };

  const topPosts = (posts || []).filter(isTopLevelPost);
  const postIds = topPosts.map((p) => p.id);
  const userIds = [...new Set(topPosts.map((p) => p.user_id).filter(Boolean))];

  const profilesMap = {};
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, unique_code')
      .in('id', userIds);
    (profiles || []).forEach((p) => { profilesMap[p.id] = p; });
  }

  const likeCounts = {};
  const myLikes = new Set();
  const replyCounts = {};

  if (postIds.length) {
    const { data: likes } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds);
    (likes || []).forEach((l) => {
      likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
      if (l.user_id === userId) myLikes.add(l.post_id);
    });

    const { data: replies } = await supabase.from('posts').select('parent_id').in('parent_id', postIds);
    (replies || []).forEach((r) => {
      if (r.parent_id) replyCounts[r.parent_id] = (replyCounts[r.parent_id] || 0) + 1;
    });
  }

  const enriched = topPosts.map((p) => ({
    ...p,
    profile: profilesMap[p.user_id] || { nickname: p.author },
    likeCount: likeCounts[p.id] || 0,
    replyCount: replyCounts[p.id] || 0,
    liked: myLikes.has(p.id),
  }));

  return { posts: enriched, error: null };
}

export async function togglePostLike(userId: string, postId: number, currentlyLiked: boolean) {
  if (currentlyLiked) {
    await supabase.from('post_likes').delete().eq('user_id', userId).eq('post_id', postId);
    return { liked: false };
  }
  const { error } = await supabase.from('post_likes').insert([{ user_id: userId, post_id: postId }]);
  if (error?.message?.includes('post_likes') || error?.code === '42P01') {
    return { liked: false, error: 'post_likes 테이블이 필요합니다. x-board-migration.sql을 실행해주세요.' };
  }
  return { liked: !error, error: error?.message };
}

export async function createPost(payload: {
  userId: string;
  author: string;
  content: string;
  parentId?: number | null;
  imageUrls?: string[];
}) {
  const body = {
    title: payload.content.slice(0, 80) || '게시물',
    content: payload.content.trim(),
    author: payload.author,
    user_id: payload.userId,
    views: 0,
    parent_id: payload.parentId ?? null,
    image_url: payload.imageUrls?.[0] || null,
    images: payload.imageUrls?.length ? JSON.stringify(payload.imageUrls) : null,
  };

  let { data, error } = await supabase.from('posts').insert([body]).select().single();

  if (error && payload.imageUrls?.length) {
    const fallback = await supabase.from('posts').insert([{
      title: body.title,
      content: body.content,
      author: body.author,
      user_id: body.user_id,
      views: 0,
      parent_id: body.parent_id,
    }]).select().single();
    data = fallback.data;
    error = fallback.error;
  }

  return { post: data, error: error?.message };
}

export async function fetchThread(postId: number, userId: string) {
  const { data: main, error } = await supabase.from('posts').select('*').eq('id', postId).single();
  if (error || !main) return { main: null, replies: [], error: error?.message };

  let repliesQuery = supabase.from('posts').select('*').eq('parent_id', postId).order('created_at', { ascending: true });
  const { data: replies } = await repliesQuery;

  const all = [main, ...(replies || [])];
  const userIds = [...new Set(all.map((p) => p.user_id).filter(Boolean))];
  const profilesMap = {};
  if (userIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, nickname, avatar_url, unique_code').in('id', userIds);
    (profiles || []).forEach((p) => { profilesMap[p.id] = p; });
  }

  const ids = all.map((p) => p.id);
  const likeCounts = {};
  const myLikes = new Set();
  if (ids.length) {
    const { data: likes } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', ids);
    (likes || []).forEach((l) => {
      likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
      if (l.user_id === userId) myLikes.add(l.post_id);
    });
  }

  const enrich = (p) => ({
    ...p,
    profile: profilesMap[p.user_id] || { nickname: p.author },
    likeCount: likeCounts[p.id] || 0,
    liked: myLikes.has(p.id),
  });

  return {
    main: enrich(main),
    replies: (replies || []).map(enrich),
    error: null,
  };
}
