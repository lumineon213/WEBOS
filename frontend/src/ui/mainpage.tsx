// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './mainpage.css';
import Chatting from './icon/chatting/chatting';
import Board from './icon/board/board';
import Setting from './icon/setting/setting';
import Weather from './icon/weather/weather';
import Memo from './icon/memo/memo';

interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
}

interface WindowState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  prevX?: number;
  prevY?: number;
  prevW?: number;
  prevH?: number;
}

interface BackgroundState {
  type: 'color' | 'image';
  value: string;
}

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [background, setBackground] = useState<BackgroundState>(() => {
    const savedBg = localStorage.getItem('mochi_bg');
    return savedBg ? JSON.parse(savedBg) : { type: 'color', value: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)' };
  });

  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  const [icons, setIcons] = useState<DesktopIcon[]>([
    { id: 'board', name: '📑 게시판', icon: '📑', x: 50, y: 50 },
    { id: 'chat', name: '💬 채팅', icon: '💬', x: 50, y: 150 },
    { id: 'memo', name: '📒 메모장', icon: '📒', x: 50, y: 250 },
    { id: 'settings', name: '⚙️ 설정', icon: '⚙️', x: 50, y: 350 },
  ]);

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [dragging, setDragging] = useState<{ id: string; type: 'icon' | 'window' } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('mochi_bg', JSON.stringify(background));
  }, [background]);

  const handleOpenApp = (id: string) => {
    setIsStartMenuOpen(false); // ✅ 앱 실행 시 스타트 메뉴 닫기
    const existing = windows.find(win => win.id === id);
    if (existing) {
      setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: false } : w));
      return;
    }
    const isChat = id === 'chat';
    setWindows([...windows, { 
      id, x: 120, y: 60,
      width: isChat ? 960 : 600,
      height: isChat ? 620 : 450,
      isMaximized: false, isMinimized: false 
    }]);
  };

  const toggleMaximize = (id: string) => {
    setWindows(windows.map(win => {
      if (win.id !== id) return win;
      if (!win.isMaximized) {
        return { 
          ...win, isMaximized: true, 
          prevX: win.x, prevY: win.y, prevW: win.width, prevH: win.height,
          x: 0, y: 0, width: window.innerWidth, height: window.innerHeight - 80 
        };
      } else {
        return { 
          ...win, isMaximized: false, 
          x: win.prevX || 250, y: win.prevY || 100, 
          width: win.prevW || 600, height: win.prevH || 450 
        };
      }
    }));
  };

  const onMouseDown = (e: React.MouseEvent, id: string, type: 'icon' | 'window') => {
    e.stopPropagation();
    setIsStartMenuOpen(false); 
    const target = type === 'icon' ? icons.find(i => i.id === id) : windows.find(w => w.id === id);
    if (target) {
      if (type === 'window' && target.isMaximized) return;
      setDragging({ id, type });
      setOffset({ x: e.clientX - target.x, y: e.clientY - target.y });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    if (dragging.type === 'icon') {
      setIcons(prev => prev.map(i => i.id === dragging.id ? { ...i, x: e.clientX - offset.x, y: e.clientY - offset.y } : i));
    } else {
      setWindows(prev => prev.map(w => w.id === dragging.id ? { ...w, x: e.clientX - offset.x, y: e.clientY - offset.y } : w));
    }
  };

  const backgroundStyle = {
    background: background.type === 'color' ? background.value : `url(${background.value}) no-repeat center center / cover`
  };

  // ✅ 3. 로그아웃 처리 함수
  const handleLogout = () => {
    // 로컬 스토리지의 로그인 정보를 삭제합니다.
    localStorage.removeItem('isLoggedIn');
    // 시작 페이지(로그인 화면)로 이동합니다.
    navigate('/');
  };

return (
    <div 
      className="os-background" 
      style={backgroundStyle} 
      onMouseMove={onMouseMove} 
      onMouseUp={() => { setDragging(null); }} // ✅ 메뉴 닫기 로직을 여기서 제거 (중요)
      onClick={() => setIsStartMenuOpen(false)} // ✅ 바탕화면 클릭 시에만 메뉴가 닫히도록 변경
    >
      {/* 배경 데코레이션 */}
      {background.type === 'color' && (
        <>
          <div className="bg-decor cloud-1">☁️</div>
          <div className="bg-decor star-1">⭐</div>
          <div className="bg-decor flower-1">🌸</div>
        </>
      )}

      {/* 바탕화면 아이콘 */}
      <div className="desktop-area">
        {icons.map((icon) => (
          <div 
            key={icon.id} className="icon-wrapper"
            style={{ left: icon.x, top: icon.y }}
            onMouseDown={(e) => onMouseDown(e, icon.id, 'icon')}
            onDoubleClick={(e) => { e.stopPropagation(); handleOpenApp(icon.id); }} // ✅ 이벤트 전파 방지
          >
            <div className="icon-bubble">{icon.icon}</div>
            <div className="icon-label">{icon.name}</div>
          </div>
        ))}
      </div>

      {/* 스타트 메뉴 UI */}
      {isStartMenuOpen && (
        <div 
          className="start-menu-container" 
          onClick={(e) => e.stopPropagation()} // ✅ 메뉴 내부 클릭 시 메뉴가 닫히지 않게 차단
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="start-menu-header">
            <div className="user-avatar">🍡</div>
            <div className="user-info">
              <p className="user-name">채교준</p>
              <p className="user-status">온라인</p>
            </div>
            <button 
              className="power-btn" 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleLogout(); // ✅ 이제 정상 작동합니다
              }}
            >
              로그아웃
            </button>
          </div>
          <div className="start-menu-body">
            <p className="menu-section-title">자주 사용하는 앱</p>
            <div className="pinned-apps">
              {icons.map(icon => (
                <div 
                  key={icon.id} 
                  className="pinned-app-item" 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleOpenApp(icon.id); // ✅ 게시판 등 앱 실행
                  }}
                >
                  <span className="app-icon">{icon.icon}</span>
                  <span className="app-name">{icon.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="start-menu-footer">
            <div className="footer-item" onClick={(e) => { e.stopPropagation(); handleOpenApp('settings'); }}>⚙️ 설정</div>
            <div className="footer-item" onClick={(e) => { e.stopPropagation(); handleOpenApp('board'); }}>📁 문서</div>
          </div>
        </div>
      )}

      {/* 윈도우 창 렌더링 영역 */}
      {windows.map((win) => (
        !win.isMinimized && (
          <div 
            key={win.id} className={`window-frame ${win.isMaximized ? 'maximized' : ''}`}
            style={{ left: win.x, top: win.y, width: win.width, height: win.height }}
            onClick={(e) => e.stopPropagation()} // ✅ 창 클릭 시 메뉴 닫힘 방지
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="window-header" onMouseDown={(e) => onMouseDown(e, win.id, 'window')}>
              <span className="window-title">{icons.find(i => i.id === win.id)?.name}</span>
              <div className="window-controls-win">
                <button className="win-btn" onClick={(e) => { e.stopPropagation(); setWindows(windows.map(w => w.id === win.id ? {...w, isMinimized: true} : w)); }}>—</button>
                <button className="win-btn" onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}>{win.isMaximized ? '❐' : '▢'}</button>
                <button className="win-btn close" onClick={(e) => { e.stopPropagation(); setWindows(windows.filter(w => w.id !== win.id)); }}>✕</button>
              </div>
            </div>
            <div className="window-content">
              {win.id === 'chat' && <Chatting />}
              {win.id === 'board' && <Board />}
              {win.id === 'settings' && <Setting currentBackground={background} onBackgroundChange={setBackground} />}
              {win.id === 'memo' && <Memo />}
            </div>
          </div>
        )
      ))}

      {/* 우측 위젯 패널 */}
      <div className="widget-panel" onClick={(e) => e.stopPropagation()}>
        <div className="widget weather-widget-box"><Weather /></div>
        <div className="widget memo">✏️ 밥 먹기</div>
        <div className="widget draw">🎨 그림 그리기</div>
      </div>

      {/* 하단 작업표시줄 */}
      <div className="taskbar-container">
        <div className="floating-taskbar" onClick={(e) => e.stopPropagation()}>
          <button 
            className={`start-btn ${isStartMenuOpen ? 'active' : ''}`} 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsStartMenuOpen(!isStartMenuOpen); 
            }}
          >
            Mochi
          </button>
          <div className="divider" />
          {windows.map(win => (
            <div 
              key={win.id} 
              className={`taskbar-app ${win.isMinimized ? 'minimized' : 'active'}`} 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenApp(win.id);
              }}
            >
              {icons.find(i => i.id === win.id)?.icon}
            </div>
          ))}
          <div className="taskbar-time">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;