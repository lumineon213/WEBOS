// src/ui/icon/chatting/chatting.tsx
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import './chatting.css';
import { supabase } from '../../../utils/supabase';

const Chatting: React.FC = () => {
  const [rightPanelMode, setRightPanelMode] = useState('participants'); 
  const [profile, setProfile] = useState({ nickname: '', avatar_url: '', userId: '', code: '' });
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 유저 정보 로드
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const myInfo = {
          nickname: prof?.nickname || user.email.split('@')[0],
          avatar_url: prof?.avatar_url || '',
          userId: user.id,
          code: prof?.unique_code
        };
        setProfile(myInfo);
        fetchMyRooms(user.id);
      }
    };
    initChat();
  }, []);

  // 2. 방 변경 시 실시간 구독 설정
  useEffect(() => {
    if (!activeRoom) return;

    fetchMessages(activeRoom.id);
    fetchParticipants(activeRoom.id);

    // 실시간 메시지 구독 (반드시 Supabase 대시보드에서 'messages' 테이블 Realtime 활성화 필요)
    const channel = supabase.channel(`room-${activeRoom.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages', 
        filter: `room_id=eq.${activeRoom.id}` 
      }, 
      (payload) => {
        // 새 메시지가 오면 즉시 상태 업데이트
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [...prev, payload.new]);
        }
        // 메시지 삭제 시 화면에서도 즉시 제거
        if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  // 자동 스크롤
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  // 내 방 목록 불러오기
  const fetchMyRooms = async (uid) => {
    const { data } = await supabase.from('room_members').select('chat_rooms(*)').eq('user_id', uid);
    const sortedRooms = data?.map(r => r.chat_rooms).filter(Boolean) || [];
    setRooms(sortedRooms);
    // 방이 있으면 첫 번째 방 자동 선택 (선택 사항)
    if (sortedRooms.length > 0 && !activeRoom) setActiveRoom(sortedRooms[0]);
  };

  const fetchMessages = async (rid) => {
    const { data } = await supabase.from('messages').select('*').eq('room_id', rid).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  // 참여자 명단 불러오기 (본인 포함)
  const fetchParticipants = async (rid) => {
    const { data } = await supabase
      .from('room_members')
      .select('profiles(nickname, avatar_url, unique_code)')
      .eq('room_id', rid);
    setParticipants(data?.map(p => p.profiles) || []);
  };

  // 친구 추가 (DM)
  const startPrivateChat = async () => {
    const targetCode = prompt('친구의 고유 코드를 입력하세요 (#16자리):');
    if (!targetCode || targetCode === profile.code) return;

    const { data: targetUser } = await supabase.from('profiles').select('*').eq('unique_code', targetCode).single();
    if (!targetUser) return alert('존재하지 않는 코드입니다.');

    // 1. 방 생성
    const { data: room } = await supabase.from('chat_rooms').insert([{ name: `${targetUser.nickname}님`, type: 'dm' }]).select().single();
    
    // 2. 멤버 등록 (나와 상대방 둘 다 추가)
    await supabase.from('room_members').insert([
      { room_id: room.id, user_id: profile.userId },
      { room_id: room.id, user_id: targetUser.id }
    ]);
    
    fetchMyRooms(profile.userId);
    setActiveRoom(room); // 생성 후 바로 해당 방으로 이동
  };

  // 그룹 채널 생성
  const createGroupRoom = async () => {
    const name = prompt('새로운 그룹 채널 이름을 입력하세요:');
    if (!name) return;

    // 1. 방 생성
    const { data: room } = await supabase.from('chat_rooms').insert([{ name, type: 'group' }]).select().single();
    
    // 2. 나를 해당 방의 멤버로 등록
    await supabase.from('room_members').insert([{ room_id: room.id, user_id: profile.userId }]);
    
    fetchMyRooms(profile.userId);
    setActiveRoom(room);
  };

  // 메시지 전송
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;

    // INSERT 후 실시간 구독이 화면을 갱신합니다.
    const { error } = await supabase.from('messages').insert([{ 
      room_id: activeRoom.id, 
      user_id: profile.userId, 
      content: input, 
      type: 'text' 
    }]);

    if (error) {
      alert('전송 실패: ' + error.message);
    } else {
      setInput('');
    }
  };

  const isLink = (text) => /https?:\/\/[^\s]+/.test(text);

  return (
    <div className="chat-app-wrapper">
      <aside className="chat-sidebar-left">
        <div className="user-profile-summary">
          <div className="p-mini-avatar">{profile.avatar_url ? <img src={profile.avatar_url} /> : "🍡"}</div>
          <div className="p-mini-info">
            <span className="p-mini-name">{profile.nickname}</span>
            <span className="p-mini-code">{profile.code}</span>
          </div>
        </div>

        <div className="sidebar-scroll-area">
          <section className="chat-section">
            <div className="section-header"><span>개인 메시지</span> <button onClick={startPrivateChat}>👤+</button></div>
            {rooms.filter(r => r.type === 'dm').map(room => (
              <div key={room.id} className={`chat-item ${activeRoom?.id === room.id ? 'active' : ''}`} onClick={() => setActiveRoom(room)}>💬 {room.name}</div>
            ))}
          </section>

          <section className="chat-section">
            <div className="section-header"><span>채널 목록</span> <button onClick={createGroupRoom}>+</button></div>
            {rooms.filter(r => r.type === 'group').map(room => (
              <div key={room.id} className={`chat-item ${activeRoom?.id === room.id ? 'active' : ''}`} onClick={() => setActiveRoom(room)}># {room.name}</div>
            ))}
          </section>
        </div>
      </aside>

      <main className="chat-main-window">
        <header className="chat-header">
          <h2>{activeRoom ? activeRoom.name : '대화방을 선택하세요'}</h2>
        </header>

        <div className="messages-container" ref={scrollRef}>
          {!activeRoom && <div className="welcome-chat">방을 만들거나 친구를 초대하세요! 🍡</div>}
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.user_id === profile.userId ? 'me' : 'other'}`}>
              <div className="msg-bubble">
                {isLink(msg.content) ? <a href={msg.content} target="_blank" rel="noreferrer">{msg.content}</a> : msg.content}
              </div>
            </div>
          ))}
        </div>

        <form className="msg-input-area" onSubmit={sendMessage}>
          <button type="button" className="attach-btn" disabled={!activeRoom} onClick={() => fileInputRef.current?.click()}>+</button>
          <input type="text" placeholder={activeRoom ? "메시지 입력..." : "방을 먼저 선택하세요"} value={input} onChange={(e) => setInput(e.target.value)} disabled={!activeRoom} />
          <button type="submit" className="send-btn" disabled={!activeRoom}>➤</button>
        </form>
      </main>

      <aside className="chat-info-right">
        <div className="panel-tabs">
          <button className={rightPanelMode === 'participants' ? 'active' : ''} onClick={() => setRightPanelMode('participants')}>참여자</button>
          <button className={rightPanelMode === 'files' ? 'active' : ''} onClick={() => setRightPanelMode('files')}>정보</button>
        </div>
        
        <div className="panel-content">
          {rightPanelMode === 'participants' ? (
            <div className="participant-list">
              {participants.map((p, i) => (
                <div key={i} className="p-item-row">
                  <div className="p-row-avatar">{p.avatar_url ? <img src={p.avatar_url} /> : "👤"}</div>
                  <div className="p-row-info">
                    <span className="p-row-name">{p.nickname}</span>
                    <span className="p-row-code">{p.unique_code}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="file-info-area">
              <p>현재 방에 공유된 미디어와 파일 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Chatting;