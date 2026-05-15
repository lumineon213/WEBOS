// @ts-nocheck
import React from 'react';
import './board.css';

const Board: React.FC = () => {
  return (
    <div className="board-dashboard">
      {/* 1. 사이드보드 (작아지면 상단으로 이동) */}
      <nav className="board-sidebar">
        <div className="sidebar-item active">📊 대시보드</div>
        <div className="sidebar-item">📈 분석</div>
        <div className="sidebar-item">📦 주문 관리</div>
        <div className="sidebar-item">👥 고객 관리</div>
        <div className="sidebar-item">📧 이메일</div>
      </nav>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="board-content">
        <header className="content-header">
          <h2>안녕하세요, 사용자님</h2>
          <button className="report-btn">보고서 받기</button>
        </header>

        {/* 상단 통계 카드 */}
        <section className="stats-row">
          <div className="stat-card">
            <span className="stat-label">총 주문 수</span>
            <div className="stat-value">74,300 <span className="up">▲ 11.3%</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-label">페이지뷰</span>
            <div className="stat-value">62,400 <span className="up">▲ 19.7%</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-label">평균 방문 시간</span>
            <div className="stat-value">00:05:51 <span className="down">▼ 1.3%</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-label">이탈률</span>
            <div className="stat-value">21.9% <span className="down">▼ 4.5%</span></div>
          </div>
        </section>

        {/* 하단 데이터 테이블 */}
        <section className="data-section">
          <div className="data-card">
            <h3>가장 많이 방문한 페이지</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>페이지 링크</th>
                  <th>방문자</th>
                  <th>체류 시간</th>
                  <th>이탈률</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>/home</td>
                  <td>4,800</td>
                  <td>3,654s</td>
                  <td>62.54%</td>
                </tr>
                <tr>
                  <td>/documents</td>
                  <td>3,852</td>
                  <td>3,215s</td>
                  <td>76.23%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Board;