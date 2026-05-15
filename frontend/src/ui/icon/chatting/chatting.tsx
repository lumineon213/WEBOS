// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import './chatting.css';
import { supabase } from '../../../utils/supabase';

const Chatting: React.FC = () => {
  const [activeTab, setActiveTab] = useState('메시지'); // 메시지 또는 참여자 탭
  const [profile, setProfile] = useState({ nickname: '', avatar_url: '', userId: '' });
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 초기 데이터 로드 (프로필 & 채팅방 목록)
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const idOnly = user.email.split('@')[0];
        // 프로필 정보 가져오기
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile({
          nickname: prof?.nickname || idOnly,
          avatar_url: prof?.avatar_url || '',
          userId: user.id
        });

        // 채팅방 목록 가져오기
        fetchRooms();
      }
    };
    initChat();
  }, []);

  // 2. 채팅방 데이터 및 실시간 구독
  useEffect(() => {
    if (!activeRoom) return;

    fetchMessages(activeRoom.id);
    fetchParticipants(activeRoom.id);

    // 실시간 메시지 구독 (새 메시지가 오면 즉시 반영)
    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  // 자동 스크롤 하단 이동
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const fetchRooms = async () => {
    const { data } = await supabase.from('chat_rooms').select('*').order('created_at', { ascending: true });
    setRooms(data || []);
    if (data && data.length > 0 && !activeRoom) setActiveRoom(data[0]);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const fetchParticipants = async (roomId: string) => {
    // 실제로는 참여자 테이블이 따로 필요하지만, 예시로 메시지 작성자들을 중복 제거하여 표시
    const { data } = await supabase.from('messages').select('user_id').eq('room_id', roomId);
    const uniqueUsers = [...new Set(data?.map(m => m.user_id))];
    setParticipants(uniqueUsers);
  };

  // 3. 메시지 전송
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;

    const { error } = await supabase.from('messages').insert([{
      room_id: activeRoom.id,
      user_id: profile.userId,
      content: input,
      type: 'text'
    }]);

    if (!error) setInput('');
  };

  // 4. 채팅방 생성
  const createRoom = async () => {
    const name = prompt('새로운 채팅방 이름을 입력하세요:');
    if (!name) return;
    const { error } = await supabase.from('chat_rooms').insert([{ name, created_by: profile.userId }]);
    if (!error) fetchRooms();
  };

  // 5. 파일 업로드 (Base64 변환 후 전송)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeRoom) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await supabase.from('messages').insert([{
          room_id: activeRoom.id,
          user_id: profile.userId,
          content: reader.result as string,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  // 통계 계산용 (현재 방의 공유 파일 수)
  const fileStats = {
    all: messages.filter(m => m.type !== 'text').length,
    img: messages.filter(m => m.type === 'image').length,
    vid: messages.filter(m => m.type === 'video').length
  };

  return (
    <div className="chat-app-wrapper">
      {/* 좌측 사이드바: 내 프로필 반영 */}
      <aside className="chat-sidebar-left">
        <div className="user-profile">
          <div className="profile-img">
            {profile.avatar_url ? <img src={profile.avatar_url} className="avatar-img" /> : "👤"}
          </div>
          <h3>{profile.nickname}</h3>
          <span className="status available">온라인 ⌵</span>
        </div>
        <div className="chat-list">
          <div className="list-header">
            <p className="list-title">채팅방 목록</p>
            <button className="add-chat-btn" onClick={createRoom}>+</button>
          </div>
          {rooms.map(room => (
            <div key={room.id} className={`chat-item ${activeRoom?.id === room.id ? 'active' : ''}`} onClick={() => setActiveRoom(room)}>
              <div className="item-img">🏢</div>
              <div className="item-info">
                <div className="item-header"><span>{room.name}</span></div>
                <p className="last-msg">최근 대화 보기</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 중앙 채팅 창 */}
      <main className="chat-main-window">
        <header className="chat-header">
          <h2>{activeRoom?.name || '방을 선택해주세요'}</h2>
          <div className="header-actions">
            <div className="header-tabs">
              <span className={`tab ${activeTab === '메시지' ? 'active' : ''}`} onClick={() => setActiveTab('메시지')}>메시지</span>
              <span className={`tab ${activeTab === '참여자' ? 'active' : ''}`} onClick={() => setActiveTab('참여자')}>참여자</span>
            </div>
          </div>
        </header>

        {activeTab === '메시지' ? (
          <>
            <div className="messages-container" ref={scrollRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.user_id === profile.userId ? 'me' : 'other'}`}>
                  <div className="msg-content">
                    <div className="msg-bubble">
                      {msg.type === 'text' && msg.content}
                      {msg.type === 'image' && <img src={msg.content} className="shared-media" alt="img" />}
                      {msg.type === 'video' && <video src={msg.content} controls className="shared-media" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <form className="msg-input-area" onSubmit={sendMessage}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileUpload} />
              <button type="button" className="attach-btn" onClick={() => fileInputRef.current?.click()}>+</button>
              <input type="text" placeholder="메시지를 입력하세요..." value={input} onChange={(e) => setInput(e.target.value)} />
              <button type="submit" className="send-btn">➤</button>
            </form>
          </>
        ) : (
          <div className="participants-list">
            <p style={{padding: '20px', color: '#888'}}>{participants.length}명이 대화 중입니다.</p>
            {/* 참여자 상세 목록 UI 추가 가능 */}
          </div>
        )}
      </main>

      {/* 우측 정보 패널: 공유 미디어 통계 반영 */}
      <aside className="chat-info-right">
        <h3>공유된 파일</h3>
        <div className="stats-boxes">
          <div className="stat-box teal"><span className="count">{fileStats.all}</span><span className="label">모든 파일</span></div>
          <div className="stat-box gray"><span className="count">0</span><span className="label">링크</span></div>
        </div>
        <div className="file-types">
          <div className="file-type-item">🖼️ 사진 <span>{fileStats.img}개</span></div>
          <div className="file-type-item">🎬 영상 <span>{fileStats.vid}개</span></div>
        </div>
      </aside>
    </div>
  );
};

export default Chatting;