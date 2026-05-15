// @ts-nocheck
import React, { useState, useRef } from 'react';
import './chatting.css';

const Chatting: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'Evan Scott', time: '11:25 AM', text: '더 하실 말씀 없으신가요? 😊', isMe: false, type: 'text' },
    { id: 2, user: '나', time: '11:26 AM', text: '분위기가 정말 신비롭네요.', isMe: true, type: 'text' },
  ]);
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now(),
      user: '나',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: input,
      isMe: true,
      type: 'text'
    };
    setMessages([...messages, newMessage]);
    setInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const url = URL.createObjectURL(file);
      const newMessage = {
        id: Date.now(),
        user: '나',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: url,
        isMe: true,
        type: isImage ? 'image' : 'video'
      };
      setMessages([...messages, newMessage]);
    }
  };

  return (
    <div className="chat-app-wrapper">
      <aside className="chat-sidebar-left">
        <div className="user-profile">
          <div className="profile-img">👤</div>
          <h3>채교준</h3>
          <span className="status available">접속 중 ⌵</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="검색" />
        </div>
        <div className="chat-list">
          <div className="list-header">
            <p className="list-title">마지막 채팅</p>
            <button className="add-chat-btn" title="방 만들기">+</button>
          </div>
          <div className="chat-item active">
            <div className="item-img">🏢</div>
            <div className="item-info">
              <div className="item-header"><span>부동산 거래방</span><span className="time">11:15</span></div>
              <p className="last-msg">그룹 채팅</p>
            </div>
          </div>
          <div className="chat-item">
            <div className="item-img">👤</div>
            <div className="item-info">
              <div className="item-header"><span>이현석</span><span className="time">10:05</span></div>
              <p className="last-msg">개인 채팅</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="chat-main-window">
        <header className="chat-header">
          <div className="header-info">
            <h2>그룹 채팅</h2>
          </div>
          <div className="header-actions">
            <button className="action-icon call-icon" title="음성 통화">📞</button>
            <div className="header-tabs">
              <span className="tab active">메시지</span>
              <span className="tab">참여자</span>
            </div>
          </div>
        </header>

        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.isMe ? 'me' : 'other'}`}>
              {!msg.isMe && <div className="msg-avatar">👤</div>}
              <div className="msg-content">
                {!msg.isMe && <span className="msg-user">{msg.user}, {msg.time}</span>}
                <div className="msg-bubble">
                  {msg.type === 'text' && msg.text}
                  {msg.type === 'image' && <img src={msg.text} alt="공유 이미지" className="shared-media" />}
                  {msg.type === 'video' && <video src={msg.text} controls className="shared-media" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form className="msg-input-area" onSubmit={sendMessage}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*,video/*" 
            onChange={handleFileUpload}
          />
          {/* ✅ 아이콘을 + 모양으로 변경 */}
          <button type="button" className="attach-btn" onClick={() => fileInputRef.current?.click()}>+</button>
          <input 
            type="text" 
            placeholder="메시지를 입력하세요..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
          />
          <button type="submit" className="send-btn">➤</button>
        </form>
      </main>

      <aside className="chat-info-right">
        <div className="info-header">
          <span className="arrow">〉</span>
          <h3>공유된 파일</h3>
        </div>
        <div className="shared-project">
          <div className="project-icon">🏢</div>
          <h4>부동산 거래방</h4>
          <p>멤버 10명</p>
        </div>
        <div className="stats-boxes">
          <div className="stat-box teal">
            <span className="count">231</span>
            <span className="label">모든 파일</span>
          </div>
          <div className="stat-box gray">
            <span className="count">45</span>
            <span className="label">링크</span>
          </div>
        </div>
        <div className="file-types">
          <p className="type-title">파일 형식</p>
          <div className="file-type-item">📄 문서 <span>126개</span></div>
          <div className="file-type-item">🖼️ 사진 <span>53개</span></div>
          <div className="file-type-item">🎬 영상 <span>3개</span></div>
        </div>
      </aside>
    </div>
  );
};

export default Chatting;