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
  
  // 🚀 에펨코리아 / X 스타일 보기 모드 상태값 선언
  const [viewMode, setViewMode] = useState<'x' | 'fmkorea'>('x');

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

            {/* 🚀 상단 타이틀 밑에 뷰 모드 전환 탭/버튼 배치 */}
            <div className="board-view-toggle">
              <button 
                type="button"
                className={viewMode === 'x' ? 'active' : ''} 
                onClick={() => setViewMode('x')}
              >
                📱 트위터 스타일
              </button>
              <button 
                type="button"
                className={viewMode === 'fmkorea' ? 'active' : ''} 
                onClick={() => setViewMode('fmkorea')}
              >
                📋 PC게시판 스타일
              </button>
            </div>

            {/* 🚀 피드 영역 내부를 보기 설정 상태값(viewMode)에 따라 조건부 분기 렌더링 */}
            <div className="x-feed">
              {loading ? (
                <div className="x-feed-status">타임라인 불러오는 중…</div>
              ) : filtered.length === 0 ? (
                <div className="x-feed-empty">
                  <p>{search ? '검색 결과가 없습니다.' : '아직 게시물이 없습니다.'}</p>
                  <p className="x-feed-hint">첫 번째 포스트를 작성해보세요!</p>
                </div>
              ) : viewMode === 'x' ? (
                // [선택 1] 기존의 X 스타일 피드
                filtered.map((post) => (
                  <BoardPost
                    key={post.id}
                    post={post}
                    onOpen={openThread}
                    onLike={handleLike}
                    onReply={openThread}
                  />
                ))
              ) : (
                // [선택 2] 에펨코리아 스타일 정갈한 표 리스트 (신규 추가)
                <div className="fm-board-container">
                  <table className="fm-table">
                    <thead>
                      <tr>
                        <th className="fm-th-id">번호</th>
                        <th className="fm-th-title">제목</th>
                        <th className="fm-th-author">글쓴이</th>
                        <th className="fm-th-date">날짜</th>
                        <th className="fm-th-views">조회</th>
                        <th className="fm-th-likes">추천</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((post) => {
                        const prof = post.profile || {};
                        const replyCount = post.reply_count || post.replies?.length || 0;
                        const likeCount = post.like_count || post.likes?.length || 0;
                        
                        return (
                          <tr key={post.id} className="fm-tr" onClick={() => openThread(post.id)}>
                            <td className="fm-td-id">{post.id}</td>
                            <td className="fm-td-title">
                              <span className="fm-title-text">
                                {post.title || post.content?.slice(0, 30) || '제목 없음'}
                              </span>
                              {replyCount > 0 && (
                                <span className="fm-reply-count">[{replyCount}]</span>
                              )}
                              {post.image_url && <span className="fm-img-icon">🖼️</span>}
                            </td>
                            <td className="fm-td-author">{prof.nickname || post.author || '익명'}</td>
                            <td className="fm-td-date">
                              {new Date(post.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                            </td>
                            <td className="fm-td-views">{post.views || 0}</td>
                            <td className="fm-td-likes-count">{likeCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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