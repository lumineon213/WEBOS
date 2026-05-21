// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './board.css';
import { supabase } from '../../../utils/supabase';
import { fetchTimelinePosts, togglePostLike } from './board-utils';
import { useAuth } from '../../../hooks/useAuth';
import BoardCompose from './sub/board-compose';
import BoardPost from './sub/board-post';
import BoardThread from './sub/board-thread';
import BoardSetting from './boardsetting/boardsetting';

const Board: React.FC = () => {
  const { isAdmin, nickname, uniqueCode } = useAuth();
  const [tab, setTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [threadId, setThreadId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || '';
    setUserId(uid);
    const { posts: list, error } = await fetchTimelinePosts(uid);
    if (error) console.warn(error);
    setPosts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'home' || tab === 'explore') loadFeed();
  }, [tab, loadFeed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.content?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.profile?.nickname?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  const handleLike = async (postId: number, liked: boolean) => {
    if (!userId) return;
    const res = await togglePostLike(userId, postId, liked);
    if (res.error) alert(res.error);
    loadFeed();
  };

  const openThread = (id: number) => {
    setThreadId(id);
    setTab('thread');
  };

  const backFromThread = () => {
    setThreadId(null);
    setTab('home');
  };

  return (
    <div className="x-app">
      <nav className="x-nav">
        <div className="x-nav-inner">
          <button
            type="button"
            className={`x-nav-item ${tab === 'home' || tab === 'thread' ? 'active' : ''}`}
            onClick={() => { setTab('home'); setThreadId(null); }}
          >
            <span className="x-nav-icon">🏠</span>
            <span className="x-nav-label">홈</span>
          </button>
          <button
            type="button"
            className={`x-nav-item ${tab === 'explore' ? 'active' : ''}`}
            onClick={() => { setTab('explore'); setThreadId(null); }}
          >
            <span className="x-nav-icon">🔍</span>
            <span className="x-nav-label">탐색</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`x-nav-item ${tab === 'admin' ? 'active' : ''}`}
              onClick={() => { setTab('admin'); setThreadId(null); }}
            >
              <span className="x-nav-icon">⚙️</span>
              <span className="x-nav-label">관리</span>
            </button>
          )}
          <button type="button" className="x-nav-post-btn" onClick={() => setTab('home')}>
            게시하기
          </button>
        </div>
        <div className="x-nav-user">
          <span className="x-nav-user-name">{nickname || '사용자'}</span>
          <span className="x-nav-user-code">{uniqueCode}</span>
        </div>
      </nav>

      <main className="x-main">
        {tab === 'thread' && threadId ? (
          <BoardThread
            postId={threadId}
            isAdmin={isAdmin}
            onBack={backFromThread}
            onChanged={loadFeed}
          />
        ) : tab === 'admin' && isAdmin ? (
          <div className="x-admin-wrap">
            <BoardSetting />
          </div>
        ) : (
          <>
            <header className="x-main-header">
              <h1>{tab === 'explore' ? '탐색' : '홈'}</h1>
            </header>

            {tab === 'home' && <BoardCompose onPosted={loadFeed} />}

            {tab === 'explore' && (
              <div className="x-explore-search">
                <input
                  type="search"
                  placeholder="게시물 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}

            <div className="x-feed">
              {loading ? (
                <div className="x-feed-status">타임라인 불러오는 중…</div>
              ) : filtered.length === 0 ? (
                <div className="x-feed-empty">
                  <p>{search ? '검색 결과가 없습니다.' : '아직 게시물이 없습니다.'}</p>
                  <p className="x-feed-hint">첫 번째 포스트를 작성해보세요!</p>
                </div>
              ) : (
                filtered.map((post) => (
                  <BoardPost
                    key={post.id}
                    post={post}
                    onOpen={openThread}
                    onLike={handleLike}
                    onReply={openThread}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      <aside className="x-aside">
        <div className="x-widget">
          <h3>지금 뜨는 주제</h3>
          <ul>
            <li><span className="x-trend-tag">#WEBOS</span><span>개발 중</span></li>
            <li><span className="x-trend-tag">#MochiOS</span><span>소셜 피드</span></li>
            <li><span className="x-trend-tag">#채팅</span><span>고유코드 친구추가</span></li>
          </ul>
        </div>
        <div className="x-widget muted">
          <p>𝕏 스타일 타임라인 · 좋아요 · 답글</p>
        </div>
      </aside>
    </div>
  );
};

export default Board;
