// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './mainpage.css';
import Chatting from './icon/chatting/chatting';
import Board from './icon/board/board';
import Setting from './icon/setting/setting';
import Weather from './icon/weather/weather';

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
  // 1. 배경화면 상태 (로컬 스토리지 연동)
  const [background, setBackground] = useState<BackgroundState>(() => {
    const savedBg = localStorage.getItem('mochi_bg');
    return savedBg ? JSON.parse(savedBg) : { type: 'color', value: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)' };
  });

  const [icons, setIcons] = useState<DesktopIcon[]>([
    { id: 'board', name: '📑 게시판', icon: '📑', x: 50, y: 50 },
    { id: 'chat', name: '💬 채팅', icon: '💬', x: 50, y: 150 },
    { id: 'photos', name: '🖼️ 사진첩', icon: '🖼️', x: 50, y: 250 },
    { id: 'settings', name: '⚙️ 설정', icon: '⚙️', x: 50, y: 350 },
  ]);

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [dragging, setDragging] = useState<{ id: string; type: 'icon' | 'window' } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('mochi_bg', JSON.stringify(background));
  }, [background]);

  const handleOpenApp = (id: string) => {
    const existing = windows.find(win => win.id === id);
    if (existing) {
      setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: false } : w));
      return;
    }
    setWindows([...windows, { 
      id, x: 250, y: 100, width: 600, height: 450, 
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

  // 배경 스타일 동적 적용
  const backgroundStyle = {
    background: background.type === 'color' ? background.value : `url(${background.value}) no-repeat center center / cover`
  };

  return (
    <div className="os-background" style={backgroundStyle} onMouseMove={onMouseMove} onMouseUp={() => setDragging(null)}>
      
      {background.type === 'color' && (
        <>
          <div className="bg-decor cloud-1">☁️</div>
          <div className="bg-decor star-1">⭐</div>
          <div className="bg-decor flower-1">🌸</div>
        </>
      )}

      <div className="desktop-area">
        {icons.map((icon) => (
          <div 
            key={icon.id} className="icon-wrapper"
            style={{ left: icon.x, top: icon.y }}
            onMouseDown={(e) => onMouseDown(e, icon.id, 'icon')}
            onDoubleClick={() => handleOpenApp(icon.id)}
          >
            <div className="icon-bubble">{icon.icon}</div>
            <div className="icon-label">{icon.name}</div>
          </div>
        ))}
      </div>

      {windows.map((win) => (
        !win.isMinimized && (
          <div 
            key={win.id} className={`window-frame ${win.isMaximized ? 'maximized' : ''}`}
            style={{ left: win.x, top: win.y, width: win.width, height: win.height }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="window-header" onMouseDown={(e) => onMouseDown(e, win.id, 'window')}>
              <span className="window-title">{icons.find(i => i.id === win.id)?.name}</span>
              <div className="window-controls-win">
                <button className="win-btn" onClick={(e) => setWindows(windows.map(w => w.id === win.id ? {...w, isMinimized: true} : w))}>—</button>
                <button className="win-btn" onClick={() => toggleMaximize(win.id)}>{win.isMaximized ? '❐' : '▢'}</button>
                <button className="win-btn close" onClick={() => setWindows(windows.filter(w => w.id !== win.id))}>✕</button>
              </div>
            </div>
            <div className="window-content">
              {win.id === 'chat' && <Chatting />}
              {win.id === 'board' && <Board />}
              {win.id === 'settings' && <Setting currentBackground={background} onBackgroundChange={setBackground} />}
              {win.id === 'photos' && <p>🖼️ 사진첩 준비 중...</p>}
            </div>
          </div>
        )
      ))}

      <div className="widget-panel">
        <div className="widget weather-widget-box"><Weather /></div>
        <div className="widget memo">✏️ 밥 먹기</div>
        <div className="widget draw">🎨 그림 그리기</div>
      </div>

      <div className="taskbar-container">
        <div className="floating-taskbar">
          <button className="start-btn">Mochi</button>
          <div className="divider" />
          {windows.map(win => (
            <div key={win.id} className={`taskbar-app ${win.isMinimized ? 'minimized' : 'active'}`} onClick={() => handleOpenApp(win.id)}>
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