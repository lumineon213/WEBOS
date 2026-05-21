// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './admin.css';
import { supabase } from '../../../utils/supabase';
import { ROLE_ADMIN, ROLE_MEMBER } from '../../../utils/auth';
import { formatUniqueCode } from '../../../utils/uniqueCode';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: postList }] = await Promise.all([
      supabase.from('profiles').select('id, nickname, role, unique_code, updated_at').order('updated_at', { ascending: false }),
      supabase.from('posts').select('id, title, author, created_at, user_id').order('created_at', { ascending: false }).limit(50),
    ]);
    setUsers(profiles || []);
    setPosts(postList || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) alert('역할 변경 실패: ' + error.message);
    else load();
  };

  const deletePost = async (postId: number) => {
    if (!window.confirm('이 게시글을 삭제할까요?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) alert('삭제 실패: ' + error.message);
    else load();
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h2>🛡️ 관리자 패널</h2>
        <span className="admin-badge">ADMIN ONLY</span>
      </header>

      <nav className="admin-tabs">
        <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          회원 관리
        </button>
        <button type="button" className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
          게시글 관리
        </button>
      </nav>

      {loading ? (
        <p className="admin-loading">불러오는 중...</p>
      ) : tab === 'users' ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>역할</th>
                <th>고유코드</th>
                <th>변경</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.nickname || '—'}</td>
                  <td>
                    <span className={`role-tag ${u.role === ROLE_ADMIN ? 'admin' : 'member'}`}>
                      {u.role || ROLE_MEMBER}
                    </span>
                  </td>
                  <td className="code-cell">{formatUniqueCode(u.unique_code) || '—'}</td>
                  <td>
                    <select
                      value={u.role === ROLE_ADMIN ? ROLE_ADMIN : ROLE_MEMBER}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      <option value={ROLE_MEMBER}>{ROLE_MEMBER}</option>
                      <option value={ROLE_ADMIN}>{ROLE_ADMIN}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>작성자</th>
                <th>날짜</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.author}</td>
                  <td>{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button type="button" className="admin-danger-btn" onClick={() => deletePost(p.id)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
