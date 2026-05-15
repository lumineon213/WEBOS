// src/ui/icon/memo/memo.tsx
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './memo.css';
import { supabase } from '../../../utils/supabase';

const Memo: React.FC = () => {
  const [content, setContent] = useState('');
  const [memoList, setMemoList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 1. 현재 로그인한 유저의 정보를 가져와서 해당 유저의 메모만 불러오기
  const fetchMemos = async () => {
    // 현재 세션에서 유저 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('user_id', user.id) // 내 아이디와 일치하는 데이터만 가져옴
      .order('created_at', { ascending: false });

    if (!error) {
      setMemoList(data || []);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  // 2. 메모 저장 및 수정 (내 ID 포함)
  const handleSave = async () => {
    if (!content.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인 정보가 없습니다. 다시 로그인해 주세요.');
      return;
    }

    setIsLoading(true);

    if (editingId) {
      // 수정 모드: RLS 정책에 의해 내 것만 수정 가능
      const { error } = await supabase
        .from('memos')
        .update({ content })
        .eq('id', editingId);

      if (error) alert('수정 실패: ' + error.message);
      else alert('메모가 수정되었습니다! ✨');
    } else {
      // 새 생성 모드: user_id를 명시적으로 저장
      const { error } = await supabase
        .from('memos')
        .insert([{ 
          content, 
          title: '새 메모', 
          user_id: user.id // 현재 유저의 ID를 함께 저장
        }]);

      if (error) alert('저장 실패: ' + error.message);
      else {
        alert('새 메모가 저장되었습니다! 🍡');
        handleNewMemo();
      }
    }

    setIsLoading(false);
    fetchMemos();
  };

  // 3. 새 메모 작성 상태로 초기화
  const handleNewMemo = () => {
    setEditingId(null);
    setContent('');
  };

  // 4. 삭제 로직 (내 것만 삭제 가능)
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 메모를 삭제할까요?')) {
      const { error } = await supabase.from('memos').delete().eq('id', id);
      if (!error) {
        if (editingId === id) handleNewMemo();
        fetchMemos();
      }
    }
  };

  return (
    <div className="memo-app-wrapper">
      <div className="memo-paper-container">
        <textarea 
          className="memo-editor"
          placeholder="나만의 소중한 기록을 남겨보세요... ✍️"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="memo-corner-fold"></div>
      </div>
      
      <div className="memo-footer-bar">
        <span className="memo-timestamp">
          {editingId ? '📍 편집 중' : '📝 새 메모 작성'}
        </span>
        <div className="memo-actions">
          <button className="memo-clear-btn" onClick={handleNewMemo}>
            새로 쓰기
          </button>
          <button className="memo-save-action" onClick={handleSave} disabled={isLoading}>
            {editingId ? '수정 완료' : '저장하기'}
          </button>
        </div>
      </div>

      <div className="memo-history-container">
        <div className="memo-history-header">내가 저장한 기록</div>
        <div className="memo-list-scroll">
          {memoList.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#ccc', textAlign: 'center', padding: '10px' }}>
              저장된 메모가 없습니다.
            </p>
          ) : (
            memoList.map((memo) => (
              <div 
                key={memo.id} 
                className={`memo-list-item ${editingId === memo.id ? 'active' : ''}`}
                onClick={() => { setEditingId(memo.id); setContent(memo.content); }}
              >
                <span className="memo-item-text">{memo.content}</span>
                <button className="memo-delete-btn" onClick={(e) => handleDelete(memo.id, e)}>삭제</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Memo;