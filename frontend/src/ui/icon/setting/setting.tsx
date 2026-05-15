// @ts-nocheck
import React, { useRef } from 'react';
import './setting.css';

interface SettingProps {
  currentBackground: { type: 'color' | 'image'; value: string };
  onBackgroundChange: (newBg: { type: 'color' | 'image'; value: string }) => void;
}

const themePresets = [
  { name: '모찌 핑크', value: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)' },
  { name: '하늘 솜사탕', value: 'linear-gradient(135deg, #aedff7 0%, #e4f1fe 100%)' },
  { name: '라벤더 꿈', value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
  { name: '단색 화이트', value: '#ffffff' },
];

const Setting: React.FC<SettingProps> = ({ currentBackground, onBackgroundChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (colorValue: string) => {
    onBackgroundChange({ type: 'color', value: colorValue });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        onBackgroundChange({ type: 'image', value: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="settings-app">
      <section className="settings-section">
        <h3 className="section-title">👤 사용자 프로필</h3>
        <div className="profile-card">
          <div className="profile-avatar">🍡</div>
          <div className="profile-info">
            <p className="p-name">채교준</p>
            <p className="p-role">Web Developer</p>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="section-title">🖼️ 배경화면 설정</h3>
        
        <div className="setting-item-column">
          <span className="setting-label">나만의 사진 업로드</span>
          <div className="photo-upload-area">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              {currentBackground.type === 'image' ? '다른 사진 선택' : '사진 불러오기'}
            </button>
          </div>
        </div>

        <div className="setting-item-column">
          <span className="setting-label">테마 및 색상</span>
          <div className="theme-grid">
            {themePresets.map((theme, i) => (
              <button 
                key={i} 
                className={`theme-circle ${currentBackground.value === theme.value ? 'active' : ''}`}
                style={{ background: theme.value }}
                onClick={() => handleColorChange(theme.value)}
              />
            ))}
            <input 
              type="color" 
              className="custom-picker"
              value={currentBackground.type === 'color' ? currentBackground.value : '#ffffff'} 
              onChange={(e) => handleColorChange(e.target.value)} 
            />
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="section-title">⚙️ 시스템 정보</h3>
        <div className="info-box">
          <p>Mochi OS v1.0.2026</p>
          <p>React + Spring Boot Project</p>
        </div>
      </section>
    </div>
  );
};

export default Setting;