// @ts-nocheck
import React from 'react';
import { parsePostImages, formatRelativeTime, authorHandle } from '../board-utils';

interface BoardPostProps {
  post: Record<string, unknown>;
  onOpen?: (id: number) => void;
  onLike?: (id: number, liked: boolean) => void;
  onReply?: (id: number) => void;
  compact?: boolean;
}

const BoardPost: React.FC<BoardPostProps> = ({ post, onOpen, onLike, onReply, compact = false }) => {
  const images = parsePostImages(post);
  const profile = post.profile || {};
  const handle = authorHandle(profile, post.author);

  const stop = (e) => e.stopPropagation();

  return (
    <article
      className={`x-post ${compact ? 'compact' : ''}`}
      onClick={() => onOpen?.(post.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(post.id)}
    >
      <div className="x-post-avatar" onClick={stop}>
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" />
        ) : (
          <span>{(profile.nickname || post.author || '?')[0]}</span>
        )}
      </div>

      <div className="x-post-body">
        <header className="x-post-header">
          <span className="x-post-name">{profile.nickname || post.author}</span>
          <span className="x-post-handle">{handle}</span>
          <span className="x-post-dot">·</span>
          <time className="x-post-time">{formatRelativeTime(post.created_at)}</time>
        </header>

        <div className="x-post-text">
          {post.content?.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
        </div>

        {images.length > 0 && (
          <div className={`x-post-media count-${Math.min(images.length, 4)}`} onClick={stop}>
            {images.slice(0, 4).map((src, i) => (
              <img key={i} src={src} alt="" />
            ))}
          </div>
        )}

        <footer className="x-post-actions" onClick={stop}>
          <button
            type="button"
            className="x-action reply"
            onClick={() => onReply?.(post.id)}
            title="답글"
          >
            <span className="x-action-icon">💬</span>
            <span>{post.replyCount > 0 ? post.replyCount : ''}</span>
          </button>
          <button type="button" className="x-action repost" title="리포스트 (준비 중)" disabled>
            <span className="x-action-icon">🔁</span>
          </button>
          <button
            type="button"
            className={`x-action like ${post.liked ? 'active' : ''}`}
            onClick={() => onLike?.(post.id, post.liked)}
            title="좋아요"
          >
            <span className="x-action-icon">{post.liked ? '❤️' : '🤍'}</span>
            <span>{post.likeCount > 0 ? post.likeCount : ''}</span>
          </button>
          <button type="button" className="x-action share" title="조회">
            <span className="x-action-icon">📊</span>
            <span>{post.views > 0 ? post.views : ''}</span>
          </button>
        </footer>
      </div>
    </article>
  );
};

export default BoardPost;
