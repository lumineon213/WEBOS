// src/ui/register/register.tsx
// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import './register.css';

const Register: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      alert('비밀번호는 최소 6글자 이상이어야 합니다! (Supabase 기본 설정)');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다!');
      return;
    }

    setIsLoading(true);
    
    // 핵심 로직: 아이디를 가짜 이메일로 변환
    const pseudoEmail = `${userId}@mochi.os`;

    const { data, error } = await supabase.auth.signUp({
      email: pseudoEmail,
      password: password,
    });

    setIsLoading(false);

    if (error) {
      alert('회원가입 실패: ' + error.message);
    } else {
      alert(`${userId}님, 회원가입 성공! 이제 로그인해 주세요. 🍡`);
      navigate('/'); 
    }
  };

  return (
    <div className="login-screen">
      <div className="login-decor cloud">☁️</div>
      <div className="login-decor star">⭐</div>
      <div className="login-window-mochi">
        <div className="login-header-mochi">
          <div className="login-traffic-lights">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <span className="login-title">Mochi OS Register</span>
        </div>
        <form className="login-form" onSubmit={handleRegister}>
          <div className="login-avatar">🍡</div>
          <h2>Join Mochi OS</h2>
          <div className="input-field">
            <input 
              type="text" 
              placeholder="Your ID" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              required
            />
          </div>
          <div className="input-field">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          <div className="input-field">
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required
            />
          </div>
          <div className="login-action-btns">
            <button type="submit" className="btn-signup" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Register'}
            </button>
            <button type="button" className="btn-login" onClick={() => navigate('/')}>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;