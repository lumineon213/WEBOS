// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 임시 로그인 로직 (아이디: admin / 비번: 1234)
    if (userId === 'admin' && password === '1234') {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/main');
    } else {
      alert('아이디 또는 비밀번호를 확인해주세요! (admin / 1234)');
    }
  };

  return (
    <div className="login-screen">
      {/* 배경 장식 요소 */}
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
              placeholder="Username" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
            />
          </div>
          <div className="input-field">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          
          <div className="login-action-btns">
            <button type="submit" className="btn-login">Login</button>
            <button type="button" className="btn-signup">Sign Up</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;