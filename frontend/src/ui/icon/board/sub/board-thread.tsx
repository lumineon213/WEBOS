// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../utils/supabase';
import { fetchThread, togglePostLike } from '../board-utils';
import BoardPost from './board-post';
import BoardCompose from './board-compose';

interface BoardThreadProps {
  postId: number;
  isAdmin: boolean;
  onBack: () => void;
  onChanged: () => void;
}

const BoardThread: React.FC<BoardThreadProps> = ({ postId, isAdmin, onBack, onChanged }) => {
  const [main, setMain] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || '';
    setUserId(uid);
    const { main: m, replies: r, error } = await fetchThread(postId, uid);
    if (m) {
      setMain(m);
      setReplies(r);
      await supabase.from('posts').update({ views: (m.views || 0) + 1 }).eq('id', postId);
    }
    if (error) console.warn(error);
    setLoading(false);
  };

  useEffect(() => { load(); }, [postId]);

  const handleLike = async (id: number, liked: boolean) => {
    if (!userId) return;
    const res = await togglePostLike(userId, id, liked);
    if (res.error) alert(res.error);
    load();
    onChanged();
  };

  const handleDelete = async () => {
    if (!window.confirm('이 게시물을 삭제할까요?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    onChanged();
    onBack();
  };

  const canDeleteMain = main && (main.user_id === userId || isAdmin);

  if (loading) return <div className="x-thread-loading">불러오는 중…</div>;
  if (!main) return <div className="x-thread-loading">게시물을 찾을 수 없습니다.</div>;

  return (
    <div className="x-thread">
      <header className="x-thread-header">
        <button type="button" className="x-back-btn" onClick={onBack}>←</button>
        <h2>게시물</h2>
        {canDeleteMain && (
          <button type="button" className="x-delete-btn" onClick={handleDelete}>삭제</button>
        )}
      </header>

      <BoardPost
        post={{ ...main, replyCount: replies.length }}
        onLike={handleLike}
        onReply={() => setShowReplyBox(true)}
        compact
      />

      <div className="x-thread-reply-bar">
        <button type="button" className="x-reply-toggle" onClick={() => setShowReplyBox((v) => !v)}>
          {showReplyBox ? '답글 숨기기' : '답글 달기'}
        </button>
      </div>

      {showReplyBox && (
        <BoardCompose
          parentId={postId}
          placeholder="답글 게시하기"
          compact
          onPosted={() => { load(); onChanged(); setShowReplyBox(false); }}
          onCancel={() => setShowReplyBox(false)}
        />
      )}

      <section className="x-replies">
        {replies.length === 0 ? (
          <p className="x-replies-empty">첫 번째 답글을 남겨보세요.</p>
        ) : (
          replies.map((r) => (
            <BoardPost key={r.id} post={r} onLike={handleLike} compact />
          ))
        )}
      </section>
    </div>
  );
};

export default BoardThread;
