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

  // 🚀 PC게시판 전용 페이징 상태값 (한 페이지에 20개씩 끊기)
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || '';
    setUserId(uid);
    const { posts: list, error } = await fetchTimelinePosts(uid);
    if (error) console.warn(error);
    setPosts(list || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'home' || tab === 'explore') {
      loadFeed();
      setCurrentPage(1); // 탭이 변경되면 PC게시판 페이지도 1페이지로 리셋
    }
  }, [tab, loadFeed]);

  // 검색 필터링된 전체 데이터
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

  // 🚀 PC게시판(fmkorea) 스타일에서만 사용할 페이지별 20개 슬라이싱 데이터
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = useMemo(() => {
    return filtered.slice(indexOfFirstPost, indexOfLastPost);
  }, [filtered, indexOfFirstPost, indexOfLastPost]);

  // PC게시판 기준 총 페이지 수
  const totalPages = Math.ceil(filtered.length / postsPerPage);

  const handleLike = async (postId: number, liked: boolean) => {
    if (!userId) return;
    const res = await togglePostLike(userId, postId, liked);
    if (res.error) alert(res.error);
    loadFeed();
  };

  // 상세 보기 열기 (중복 조회 방지를 위해 화면 전환용 역할만 수행)
  const openThread = async (id: number) => {
    try {
      setThreadId(id);
      setTab('thread');
      loadFeed();
    } catch (err) {
      console.error('상세 보기 전환 실패:', err);
      setThreadId(id);
      setTab('thread');
    }
  };

  const backFromThread = () => {
    setThreadId(null);
    setTab('home');
    loadFeed();
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

            {tab === 'home' && (
              <>
                <BoardCompose onPosted={loadFeed} />
                <div className="board-view-toggle">
                  <div className="view-toggle-pill">
                    <button 
                      type="button"
                      className={`pill-btn ${viewMode === 'x' ? 'active' : ''}`} 
                      onClick={() => setViewMode('x')}
                    >
                      <span className="pill-icon">📱</span>
                      <span>피드</span>
                    </button>
                    <button 
                      type="button"
                      className={`pill-btn ${viewMode === 'fmkorea' ? 'active' : ''}`} 
                      onClick={() => setViewMode('fmkorea')}
                    >
                      <span className="pill-icon">📋</span>
                      <span>게시판</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {tab === 'explore' && (
              <>
                <div className="x-explore-search">
                  <input
                    type="search"
                    placeholder="게시물 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="board-view-toggle">
                  <div className="view-toggle-pill">
                    <button 
                      type="button"
                      className={`pill-btn ${viewMode === 'x' ? 'active' : ''}`} 
                      onClick={() => setViewMode('x')}
                    >
                      <span className="pill-icon">📱</span>
                      <span>피드</span>
                    </button>
                    <button 
                      type="button"
                      className={`pill-btn ${viewMode === 'fmkorea' ? 'active' : ''}`} 
                      onClick={() => setViewMode('fmkorea')}
                    >
                      <span className="pill-icon">📋</span>
                      <span>게시판</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="x-feed">
              {loading ? (
                <div className="x-feed-status">타임라인 불러오는 중…</div>
              ) : filtered.length === 0 ? (
                <div className="x-feed-empty">
                  <p>{search ? '검색 결과가 없습니다.' : '아직 게시물이 없습니다.'}</p>
                  <p className="x-feed-hint">첫 번째 포스트를 작성해보세요!</p>
                </div>
              ) : viewMode === 'x' ? (
                // 🔒 [건들지 않음] 기존 트위터 스타일 피드는 무조건 원본 filtered 전체를 map 순회
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
                // 📋 [여기만 수정] PC게시판 스타일은 20개 슬라이싱된 currentPosts만 순회 렌더링
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
                      {currentPosts.map((post) => {
                        const prof = post.profile || {};
                        const replyCount = post.reply_count || post.replyCount || post.replies?.length || 0;
                        const likeCount = post.like_count || post.likeCount || post.likes?.length || 0;
                        const viewCount = post.views || post.view_count || 0;
                        
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
                              {(post.image_url || post.images) && <span className="fm-img-icon">🖼️</span>}
                            </td>
                            <td className="fm-td-author">{prof.nickname || post.author || '익명'}</td>
                            <td className="fm-td-date">
                              {new Date(post.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                            </td>
                            <td className="fm-td-views">{viewCount}</td>
                            <td className="fm-td-likes-count">{likeCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* 🚀 PC게시판 전용 독립 하단 페이징 바 작동 영역 */}
                  {totalPages > 1 && (
                    <div className="fm-pagination">
                      <button 
                        type="button" 
                        className="fm-page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        이전
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          className={`fm-page-num ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button 
                        type="button" 
                        className="fm-page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        다음
                      </button>
                    </div>
                  )}
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