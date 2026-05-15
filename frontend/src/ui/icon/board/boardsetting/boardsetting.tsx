// @ts-nocheck
import React from 'react';
import './boardsetting.css';

const BoardSetting: React.FC = () => {
  return (
    <div className="board-setting-container">
      <header className="content-header">
        <h2>게시판 시스템 설정</h2>
        <button className="save-btn">변경사항 저장</button>
      </header>

      <div className="setting-grid">
        <section className="setting-card">
          <h3>기본 정보 설정</h3>
          <div className="input-group">
            <label>게시판 이름</label>
            <input type="text" defaultValue="Mochi OS 통합 게시판" />
          </div>
          <div className="input-group">
            <label>게시판 설명</label>
            <textarea defaultValue="사용자들의 소통을 위한 공간입니다." />
          </div>
        </section>

        <section className="setting-card">
          <h3>권한 관리</h3>
          <div className="perm-item">
            <span>글쓰기 권한</span>
            <select><option>모든 사용자</option><option>관리자 전용</option></select>
          </div>
          <div className="perm-item">
            <span>댓글 권한</span>
            <select><option>모든 사용자</option><option>로그인 사용자</option></select>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BoardSetting;