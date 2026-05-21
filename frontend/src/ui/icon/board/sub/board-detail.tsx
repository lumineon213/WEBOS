// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../utils/supabase';
import { parsePostImages } from '../board-utils';

interface BoardDetailProps {
  postId: number;
  isAdmin?: boolean;
  onBack: () => void;
  onDeleted?: () => void;
}

const BoardDetail: React.FC<BoardDetailProps> = ({ postId, isAdmin = false, onBack, onDeleted }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (data && !error) {
        setPost(data);
        await supabase
          .from('posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', postId);
      }
      setLoading(false);
    };
    load();
  }, [postId]);

  const images = parsePostImages(post);
  const isOwner = post?.user_id && currentUserId === post.user_id;
  const canDelete = isOwner || isAdmin;

  const handleDelete = async () => {
    if (!window.confirm('이 게시글을 삭제할까요?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    onDeleted?.();
    onBack();
  };

  if (loading) {
    return <div className="board-detail loading">불러오는 중...</div>;
  }

  if (!post) {
    return (
      <div className="board-detail empty">
        <p>게시글을 찾을 수 없습니다.</p>
        <button type="button" className="back-btn" onClick={onBack}>목록으로</button>
      </div>
    );
  }

  return (
    <article className="board-detail">
      <header className="detail-header">
        <button type="button" className="back-btn" onClick={onBack}>← 목록</button>
        {canDelete && (
          <button type="button" className="delete-btn" onClick={handleDelete}>
            {isAdmin && !isOwner ? '관리자 삭제' : '삭제'}
          </button>
        )}
      </header>

      <h1 className="detail-title">{post.title}</h1>

      <div className="detail-meta">
        <span className="detail-author">{post.author}</span>
        <span className="detail-date">
          {new Date(post.created_at).toLocaleString('ko-KR')}
        </span>
        <span className="detail-views">조회 {post.views ?? 0}</span>
        {images.length > 0 && (
          <span className="detail-photo-badge">📷 {images.length}</span>
        )}
      </div>

      {images.length > 0 && (
        <section className="detail-gallery">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              className="gallery-thumb"
              onClick={() => setLightboxIndex(i)}
            >
              <img src={src} alt={`첨부 ${i + 1}`} />
            </button>
          ))}
        </section>
      )}

      {post.content && (
        <div className="detail-content">
          {post.content.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
        </div>
      )}

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="board-lightbox"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-nav next"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % images.length);
                }}
              >
                ›
              </button>
            </>
          )}
          <img
            src={images[lightboxIndex]}
            alt="원본"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="lightbox-counter">
            {lightboxIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </article>
  );
};

export default BoardDetail;
