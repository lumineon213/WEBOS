// src/ui/login/login.tsx
// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import './login.css';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 가입할 때와 동일한 도메인을 붙여서 로그인
    const pseudoEmail = `${userId}@mochi.os`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: pseudoEmail,
      password: password,
    });

    setIsLoading(false);

    if (error) {
      alert('아이디 또는 비밀번호가 틀렸습니다!');
    } else if (data.user) {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/main');
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
          <span className="login-title">Mochi OS Login</span>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-avatar">🍡</div>
          <h2>Welcome Back!</h2>
          <div className="input-field">
            <input 
              type="text" 
              placeholder="ID" 
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
          <div className="login-action-btns">
            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? 'Wait...' : 'Login'}
            </button>
            <button type="button" className="btn-signup" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;