// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import './setting.css';
import { supabase } from '../../../utils/supabase';

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
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('회원');
  const [avatar, setAvatar] = useState(''); // 프로필 이미지 상태
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null); // 프로필 전용 Ref

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentId = user.email.split('@')[0];
        setUserId(currentId);
        setRole(currentId === 'admin' ? '관리자' : '회원');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setNickname(profile.nickname || '');
          setAvatar(profile.avatar_url || ''); // 저장된 이미지 불러오기
        }
      }
    };
    loadProfile();
  }, []);

  // 프로필 정보(이미지 포함) 저장
  const handleProfileSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        nickname: nickname, 
        role: role,
        avatar_url: avatar, // 선택한 이미지 저장
        updated_at: new Date()
      });

    setIsLoading(false);
    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      alert('프로필이 업데이트되었습니다! ✨');
      setIsEditing(false);
    }
  };

  // 프로필 사진 업로드 처리
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (colorValue: string) => {
    onBackgroundChange({ type: 'color', value: colorValue });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
          {/* 프로필 아바타 영역 */}
          <div 
            className={`profile-avatar ${isEditing ? 'editing' : ''}`}
            onClick={() => isEditing && avatarInputRef.current?.click()}
          >
            {avatar ? (
              <img src={avatar} alt="Profile" className="avatar-img" />
            ) : (
              "🍡"
            )}
            {isEditing && <div className="avatar-overlay">📷</div>}
            <input type="file" ref={avatarInputRef} style={{display: 'none'}} accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="profile-info">
            {isEditing ? (
              <div className="profile-edit-inputs">
                <label style={{ fontSize: '11px', color: '#aaa' }}>닉네임 수정</label>
                <input 
                  type="text" 
                  value={nickname} 
                  placeholder="닉네임 입력"
                  onChange={(e) => setNickname(e.target.value)} 
                />
                <button onClick={handleProfileSave} className="profile-save-btn" disabled={isLoading}>
                  {isLoading ? '저장 중...' : '수정 완료'}
                </button>
              </div>
            ) : (
              <>
                <p className="p-name">
                  {nickname || userId} 
                  <span className="p-id">({userId})</span>
                  <button onClick={() => setIsEditing(true)} className="profile-edit-btn">편집</button>
                </p>
                <p className="p-role" style={{ color: role === '관리자' ? '#ff66aa' : '#aaa' }}>
                  {role}
                </p>
              </>
            )}
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
              value={
                currentBackground.type === 'color' && !currentBackground.value.includes('linear-gradient') 
                ? currentBackground.value 
                : '#ffffff'
              } 
              onChange={(e) => handleColorChange(e.target.value)} 
            />
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="section-title">⚙️ 시스템 정보</h3>
        <div className="info-box">
          <p>Mochi OS v1.0.2026</p>
          <p>User: {userId}@mochi-os.com</p>
        </div>
      </section>
    </div>
  );
};

export default Setting;