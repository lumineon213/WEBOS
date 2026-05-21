// src/ui/icon/setting/setting.tsx
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import './setting.css';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { ROLE_ADMIN, normalizeRole, getLoginIdFromEmail } from '../../../utils/auth';
import { ensureProfileUniqueCode } from '../../../utils/uniqueCode';

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
  const { isAdmin } = useAuth();
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState('회원');
  const [avatar, setAvatar] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null); // 배경화면용
  const avatarInputRef = useRef<HTMLInputElement>(null); // 프로필 사진용

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentId = getLoginIdFromEmail(user.email);
        setUserId(currentId);

        let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setRole(normalizeRole(profile?.role, currentId));

        const code = await ensureProfileUniqueCode(user.id, currentId, profile?.unique_code);
        if (profile) {
          setNickname(profile.nickname || '');
          setAvatar(profile.avatar_url || '');
        }
        setUniqueCode(code);
      }
    };
    loadProfile();
  }, []);

  // 고유 코드 클릭 시 클립보드 복사
  const copyToClipboard = () => {
    if (uniqueCode) {
      navigator.clipboard.writeText(uniqueCode);
      alert('고유 코드가 복사되었습니다! 🍡');
    }
  };

  const handleProfileSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setIsLoading(true);
    const loginId = getLoginIdFromEmail(user.email);
    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const saveRole = isAdmin ? role : normalizeRole(currentProfile?.role, loginId);
    const { data: prof } = await supabase.from('profiles').select('unique_code').eq('id', user.id).single();
    const fixedCode = await ensureProfileUniqueCode(user.id, loginId, prof?.unique_code);
    setUniqueCode(fixedCode);
    const { error } = await supabase.from('profiles').upsert({ 
      id: user.id, nickname, role: saveRole, avatar_url: avatar, unique_code: fixedCode, updated_at: new Date() 
    });
    setIsLoading(false);
    if (!error) { alert('프로필이 업데이트되었습니다! ✨'); setIsEditing(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 배경화면 사진 업로드 처리
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onBackgroundChange({ type: 'image', value: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (colorValue: string) => {
    onBackgroundChange({ type: 'color', value: colorValue });
  };

  return (
    <div className="settings-app">
      <section className="settings-section">
        <h3 className="section-title">👤 사용자 프로필</h3>
        <div className="profile-card">
          <div className={`profile-avatar ${isEditing ? 'editing' : ''}`} onClick={() => isEditing && avatarInputRef.current?.click()}>
            {avatar ? <img src={avatar} className="avatar-img" alt="avatar" /> : "🍡"}
            {isEditing && <div className="avatar-overlay">📷</div>}
            <input type="file" ref={avatarInputRef} style={{display: 'none'}} accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="profile-info">
            {isEditing ? (
              <div className="profile-edit-inputs">
                <input type="text" value={nickname} placeholder="닉네임 입력" onChange={(e) => setNickname(e.target.value)} />
                <button onClick={handleProfileSave} className="profile-save-btn" disabled={isLoading}>저장</button>
              </div>
            ) : (
              <>
                <p className="p-name">{nickname || userId} <span className="p-id">({userId})</span> <button onClick={() => setIsEditing(true)} className="profile-edit-btn">편집</button></p>
                <p className="p-role" style={{ color: role === ROLE_ADMIN ? '#ff66aa' : '#aaa' }}>{role}</p>
                {!isAdmin && <p className="p-role-hint">일반 회원은 관리자 전용 메뉴를 사용할 수 없습니다.</p>}
                <p className="p-code-label">고유코드 (# + 16자리)</p>
                <p className="p-code-copyable" title="클릭하여 복사" onClick={copyToClipboard}>
                  {uniqueCode || '생성 중...'}
                </p>
                <p className="p-code-hint">친구 추가 시 이 번호를 공유하세요. 닉네임이 같아도 구분됩니다.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="section-title">🖼️ 배경화면 설정</h3>
        
        {/* 누락되었던 사진 업로드 UI 복구 */}
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
              value={currentBackground.type === 'color' && !currentBackground.value.includes('linear-gradient') ? currentBackground.value : '#ffffff'} 
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