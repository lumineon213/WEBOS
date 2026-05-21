// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './chatting.css';
import { supabase } from '../../../utils/supabase';

const GROUP_GAP_MS = 5 * 60 * 1000;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '오늘';
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getInitial = (name: string) => (name?.[0] || '?').toUpperCase();

const Chatting: React.FC = () => {
  const [profile, setProfile] = useState({ nickname: '', avatar_url: '', userId: '' });
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [participantDetails, setParticipantDetails] = useState([]);
  const [showMembers, setShowMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const idOnly = user.email?.split('@')[0] || 'user';
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({
        nickname: prof?.nickname || idOnly,
        avatar_url: prof?.avatar_url || '',
        userId: user.id,
      });
      fetchRooms();
    };
    initChat();
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom.id);
    fetchParticipants(activeRoom.id);
    setSearchQuery('');

    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          fetchParticipants(activeRoom.id);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeRoom]);

  const profileMap = useMemo(() => {
    const map = {};
    participantDetails.forEach((p) => { map[p.id] = p; });
    if (profile.userId) {
      map[profile.userId] = {
        id: profile.userId,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
      };
    }
    return map;
  }, [participantDetails, profile]);

  const fetchRooms = async () => {
    const { data } = await supabase.from('chat_rooms').select('*').order('created_at', { ascending: false });
    setRooms(data || []);
    if (data?.length && !activeRoom) setActiveRoom(data[0]);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const fetchParticipants = async (roomId: string) => {
    const { data: messageData } = await supabase.from('messages').select('user_id').eq('room_id', roomId);
    const uniqueUserIds = [...new Set((messageData || []).map((m) => m.user_id).filter(Boolean))];
    if (profile.userId && !uniqueUserIds.includes(profile.userId)) {
      uniqueUserIds.push(profile.userId);
    }
    if (uniqueUserIds.length === 0) {
      setParticipantDetails(profile.userId ? [{
        id: profile.userId,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
      }] : []);
      return;
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', uniqueUserIds);
    setParticipantDetails(profileData || []);
  };

  const groupedMessages = useMemo(() => {
    const filtered = searchQuery.trim()
      ? messages.filter((m) =>
          m.type === 'text' &&
          m.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;

    const items = [];
    let lastDate = '';
    let lastUserId = '';
    let lastTime = 0;

    filtered.forEach((msg) => {
      const dateKey = new Date(msg.created_at).toDateString();
      if (dateKey !== lastDate) {
        items.push({ type: 'date', id: `date-${dateKey}`, label: formatDateLabel(msg.created_at) });
        lastDate = dateKey;
        lastUserId = '';
      }

      const msgTime = new Date(msg.created_at).getTime();
      const isGrouped =
        msg.user_id === lastUserId &&
        msgTime - lastTime < GROUP_GAP_MS;

      items.push({
        type: 'message',
        ...msg,
        isGrouped,
        author: profileMap[msg.user_id],
      });

      lastUserId = msg.user_id;
      lastTime = msgTime;
    });

    return items;
  }, [messages, searchQuery, profileMap]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !activeRoom) return;

    const { error } = await supabase.from('messages').insert([{
      room_id: activeRoom.id,
      user_id: profile.userId,
      content: text,
      type: 'text',
    }]);

    if (!error) {
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const createRoom = async () => {
    const name = prompt('새 텍스트 채널 이름:');
    if (!name?.trim()) return;
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([{ name: name.trim(), created_by: profile.userId }])
      .select()
      .single();
    if (!error) {
      await fetchRooms();
      if (data) setActiveRoom(data);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      await supabase.from('messages').insert([{
        room_id: activeRoom.id,
        user_id: profile.userId,
        content: reader.result as string,
        type: file.type.startsWith('image/') ? 'image' : 'video',
      }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const renderAvatar = useCallback((author, size = 'md') => {
    if (author?.avatar_url) {
      return <img src={author.avatar_url} alt="" className={`dc-avatar dc-avatar-${size}`} />;
    }
    return (
      <div className={`dc-avatar dc-avatar-${size} dc-avatar-fallback`}>
        {getInitial(author?.nickname || '?')}
      </div>
    );
  }, []);

  const mediaCount = messages.filter((m) => m.type !== 'text').length;

  return (
    <div className="dc-app">
      {/* 서버 레일 */}
      <nav className="dc-server-rail" aria-label="서버 목록">
        <button type="button" className="dc-server-icon dc-home" title="홈">
          <span>🏠</span>
        </button>
        <div className="dc-rail-divider" />
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            className={`dc-server-icon ${activeRoom?.id === room.id ? 'active' : ''}`}
            title={room.name}
            onClick={() => setActiveRoom(room)}
          >
            <span>{getInitial(room.name)}</span>
          </button>
        ))}
        <button type="button" className="dc-server-icon dc-add-server" title="서버 추가" onClick={createRoom}>
          <span>+</span>
        </button>
      </nav>

      {/* 채널 사이드바 */}
      <aside className="dc-channel-sidebar">
        <header className="dc-guild-header">
          <h2>WEBOS Chat</h2>
          <button type="button" className="dc-icon-btn" title="채널 만들기" onClick={createRoom}>+</button>
        </header>

        <div className="dc-channel-section">
          <div className="dc-section-label">
            <span>텍스트 채널</span>
          </div>
          <ul className="dc-channel-list">
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  className={`dc-channel-item ${activeRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => setActiveRoom(room)}
                >
                  <span className="dc-hash">#</span>
                  <span className="dc-channel-name">{room.name}</span>
                </button>
              </li>
            ))}
            {rooms.length === 0 && (
              <li className="dc-empty-hint">채널이 없습니다. + 로 만드세요.</li>
            )}
          </ul>
        </div>

        <footer className="dc-user-panel">
          {renderAvatar({ nickname: profile.nickname, avatar_url: profile.avatar_url }, 'sm')}
          <div className="dc-user-meta">
            <span className="dc-user-name">{profile.nickname || '게스트'}</span>
            <span className="dc-user-status">온라인</span>
          </div>
          <div className="dc-user-actions">
            <button type="button" className="dc-icon-btn" title="음소거">🎤</button>
            <button type="button" className="dc-icon-btn" title="설정">⚙️</button>
          </div>
        </footer>
      </aside>

      {/* 메인 채팅 */}
      <main className={`dc-chat-main ${showMembers ? '' : 'members-hidden'}`}>
        {activeRoom ? (
          <>
            <header className="dc-chat-header">
              <div className="dc-channel-title">
                <span className="dc-hash">#</span>
                <h3>{activeRoom.name}</h3>
              </div>
              <div className="dc-header-tools">
                <div className="dc-search-wrap">
                  <input
                    type="search"
                    placeholder="채널에서 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className={`dc-icon-btn ${showMembers ? 'active' : ''}`}
                  title="멤버 목록"
                  onClick={() => setShowMembers((v) => !v)}
                >
                  👥
                </button>
              </div>
            </header>

            <div className="dc-messages" ref={scrollRef}>
              <div className="dc-welcome-banner">
                <div className="dc-welcome-icon">#</div>
                <h4>{activeRoom.name}에 오신 것을 환영합니다!</h4>
                <p>이곳이 <strong>#{activeRoom.name}</strong> 채널의 시작입니다.</p>
              </div>

              {groupedMessages.length === 0 && messages.length > 0 && searchQuery && (
                <p className="dc-no-results">검색 결과가 없습니다.</p>
              )}

              {groupedMessages.map((item) => {
                if (item.type === 'date') {
                  return (
                    <div key={item.id} className="dc-date-divider">
                      <span>{item.label}</span>
                    </div>
                  );
                }

                const author = item.author || { nickname: '알 수 없음' };
                const isMe = item.user_id === profile.userId;

                return (
                  <article
                    key={item.id}
                    className={`dc-message ${item.isGrouped ? 'grouped' : 'new-group'} ${isMe ? 'mine' : ''}`}
                  >
                    {!item.isGrouped && (
                      <div className="dc-msg-avatar">{renderAvatar(author)}</div>
                    )}
                    {item.isGrouped && <div className="dc-msg-avatar-spacer" />}

                    <div className="dc-msg-body">
                      {!item.isGrouped && (
                        <header className="dc-msg-header">
                          <span className="dc-msg-author">{author.nickname || '알 수 없음'}</span>
                          <time className="dc-msg-time">{formatTime(item.created_at)}</time>
                        </header>
                      )}

                      <div className="dc-msg-content">
                        {item.type === 'text' && <p>{item.content}</p>}
                        {item.type === 'image' && (
                          <img src={item.content} className="dc-shared-media" alt="공유 이미지" />
                        )}
                        {item.type === 'video' && (
                          <video src={item.content} controls className="dc-shared-media" />
                        )}
                      </div>

                      {item.isGrouped && (
                        <time className="dc-msg-hover-time">{formatTime(item.created_at)}</time>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <form className="dc-composer" onSubmit={sendMessage}>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="dc-composer-btn"
                title="파일 첨부"
                onClick={() => fileInputRef.current?.click()}
              >
                +
              </button>
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={`#${activeRoom.name}에 메시지 보내기`}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
              />
              <button type="submit" className="dc-composer-send" disabled={!input.trim()} title="전송">
                ➤
              </button>
            </form>
          </>
        ) : (
          <div className="dc-empty-state">
            <p>왼쪽에서 채널을 선택하세요.</p>
          </div>
        )}
      </main>

      {/* 멤버 목록 */}
      {showMembers && activeRoom && (
        <aside className="dc-member-sidebar">
          <section>
            <h4>온라인 — {participantDetails.length}</h4>
            <ul>
              {participantDetails.map((member) => (
                <li key={member.id} className={`dc-member ${member.id === profile.userId ? 'me' : ''}`}>
                  <span className="dc-member-status online" />
                  {renderAvatar(member, 'sm')}
                  <span className="dc-member-name">{member.nickname}</span>
                  {member.id === profile.userId && <span className="dc-member-badge">나</span>}
                </li>
              ))}
            </ul>
          </section>

          {mediaCount > 0 && (
            <section className="dc-media-section">
              <h4>공유 미디어 — {mediaCount}</h4>
              <div className="dc-media-stats">
                <span>🖼️ {messages.filter((m) => m.type === 'image').length}</span>
                <span>🎬 {messages.filter((m) => m.type === 'video').length}</span>
              </div>
            </section>
          )}
        </aside>
      )}
    </div>
  );
};

export default Chatting;
