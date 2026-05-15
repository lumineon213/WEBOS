// @ts-nocheck
import React, { useState } from 'react';
import './board.css';
import BoardSetting from './boardsetting/boardsetting';

const Board: React.FC = () => {
  // 현재 활성화된 메뉴 상태 (dashboard, posts, settings)
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // 게시판 예시 데이터
  const [posts] = useState([
    { id: 1, title: '웹 OS 프로젝트 공지사항', author: '관리자', date: '2026-05-15', views: 124 },
    { id: 2, title: '새로운 모찌 테마 적용 가이드', author: '채교준', date: '2026-05-14', views: 89 },
    { id: 3, title: '자유게시판입니다.', author: '이현석', date: '2026-05-13', views: 45 },
  ]);

  return (
    <div className="board-dashboard">
      {/* 1. 사이드보드: 메뉴 전환 기능 추가 */}
      <nav className="board-sidebar">
        <div 
          className={`sidebar-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveMenu('dashboard')}
        >
          📊 관리 대시보드
        </div>
        <div 
          className={`sidebar-item ${activeMenu === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveMenu('posts')}
        >
          📝 전체 게시판
        </div>
        <div 
          className={`sidebar-item ${activeMenu === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveMenu('settings')}
        >
          ⚙️ 게시판 설정
        </div>
      </nav>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="board-content">
        
        {/* [A] 관리 대시보드 뷰 (기존 UI 유지) */}
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
                <div className="stat-value">12 <span className="up">▲ 2건</span></div>
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

        {/* [B] 일반 게시판 뷰 (새로운 리스트 UI) */}
        {activeMenu === 'posts' && (
          <div className="posts-view">
            <header className="content-header">
              <h2>전체 게시판</h2>
              <button className="report-btn">글쓰기</button>
            </header>
            <div className="posts-list-card">
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
                  {posts.map(post => (
                    <tr key={post.id} className="post-row-item">
                      <td>{post.id}</td>
                      <td className="post-link">{post.title}</td>
                      <td>{post.author}</td>
                      <td>{post.date}</td>
                      <td>{post.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* [C] 게시판 설정 뷰 (BoardSetting 연결) */}
        {activeMenu === 'settings' && <BoardSetting />}

      </main>
    </div>
  );
};

export default Board;