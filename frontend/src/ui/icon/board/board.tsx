// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './board.css';
import BoardSetting from './boardsetting/boardsetting';
import BoardDetail from './sub/board-detail';
import BoardWrite from './sub/board-write';
import { supabase } from '../../../utils/supabase';

const Board: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('posts'); // 기본을 전체 게시판으로 변경
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeMenu === 'posts') {
      fetchPosts();
    }
  }, [activeMenu]);

  const handlePostClick = (id: number) => {
    setSelectedPostId(id);
    setActiveMenu('detail');
  };

  const handleWriteSuccess = () => {
    setIsWriting(false);
    setActiveMenu('posts');
    fetchPosts();
  };

  return (
    <div className="board-dashboard">
      <nav className="board-sidebar">
        <div 
          className={`sidebar-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveMenu('dashboard'); setSelectedPostId(null); setIsWriting(false); }}
        >
          📊 관리 대시보드
        </div>
        <div 
          className={`sidebar-item ${activeMenu === 'posts' || activeMenu === 'detail' ? 'active' : ''}`}
          onClick={() => { setActiveMenu('posts'); setSelectedPostId(null); setIsWriting(false); }}
        >
          📝 전체 게시판
        </div>
        <div 
          className={`sidebar-item ${activeMenu === 'settings' ? 'active' : ''}`}
          onClick={() => { setActiveMenu('settings'); setSelectedPostId(null); setIsWriting(false); }}
        >
          ⚙️ 게시판 설정
        </div>
      </nav>

      <main className="board-content">
        {activeMenu === 'dashboard' && (
          <>
            <header className="content-header">
              <h2>사이트 관리 현황</h2>
              <button className="report-btn">통계 리포트</button>
            </header>
            <section className="stats-row">
              <div className="stat-card">
                <span className="stat-label">오늘 방문자</span>
                <div className="stat-value">1,240 <span className="up">▲ 5.2%</span></div>
              </div>
              <div className="stat-card">
                <span className="stat-label">새 게시글</span>
                <div className="stat-value">{posts.length} <span className="up">▲</span></div>
              </div>
              <div className="stat-card">
                <span className="stat-label">서버 부하</span>
                <div className="stat-value">14% <span className="down">▼ 2%</span></div>
              </div>
            </section>
            <section className="data-section">
              <div className="data-card">
                <h3>최근 활동 로그</h3>
                <p style={{color: '#888', fontSize: '13px'}}>관리자용 로그 확인 영역입니다.</p>
              </div>
            </section>
          </>
        )}

        {activeMenu === 'posts' && (
          <div className="posts-view">
            <header className="content-header">
              <h2>전체 게시판</h2>
              <button className="report-btn" onClick={() => setIsWriting(true)}>글쓰기</button>
            </header>
            {isWriting ? (
              <BoardWrite onBack={() => setIsWriting(false)} onSuccess={handleWriteSuccess} />
            ) : (
              <div className="posts-list-card">
                {loading ? (
                  <div className="loading">불러오는 중...</div>
                ) : (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>번호</th>
                        <th>제목</th>
                        <th>작성자</th>
                        <th>날짜</th>
                        <th>조회수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post, index) => (
                        <tr key={post.id} className="post-row-item" onClick={() => handlePostClick(post.id)}>
                          <td>{posts.length - index}</td>
                          <td className="post-link">{post.title}</td>
                          <td>{post.author}</td>
                          <td>{new Date(post.created_at).toLocaleDateString()}</td>
                          <td>{post.views}</td>
                        </tr>
                      ))}
                      {posts.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>게시글이 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {activeMenu === 'detail' && selectedPostId && (
          <BoardDetail 
            postId={selectedPostId} 
            onBack={() => setActiveMenu('posts')} 
          />
        )}

        {activeMenu === 'settings' && <BoardSetting />}
      </main>
    </div>
  );
};

export default Board;