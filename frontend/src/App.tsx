// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabase' 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './ui/login/login';
import Register from './ui/login/register'; // 회원가입 컴포넌트 추가
import MainPage from './ui/mainpage';

// 로그인 여부 확인 컴포넌트
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? children : <Navigate to="/" replace />;
};

function App() {
  // 데이터 불러오기 예제 로직 (테스트용)
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    async function getMemos() {
      const { data: memos, error } = await supabase.from('memos').select();

      if (memos) {
        setMemos(memos);
        console.log("불러온 데이터:", memos);
      }
      if (error) console.error("에러 발생:", error.message);
    }

    getMemos();
  }, []);

  return (
    <Router>
      <Routes>
        {/* 로그인 및 회원가입 경로는 누구나 접근 가능 */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        
        {/* 메인 페이지는 로그인 상태에서만 접근 가능 */}
        <Route 
          path="/main" 
          element={
            <PrivateRoute>
              <MainPage />
            </PrivateRoute>
          } 
        />
        
        {/* 잘못된 경로 입력 시 로그인 페이지로 이동 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* 데이터 리스트 테스트용 (필요 시 주석 해제) */}
      {/* <ul style={{ position: 'absolute', bottom: 0, background: 'white', zIndex: 9999 }}>
        {memos.map((memo) => (
          <li key={memo.id}>{memo.content}</li>
        ))}
      </ul> 
      */}
    </Router>
  );
}

export default App;