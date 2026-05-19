// @ts-nocheck
import React, { useState } from 'react';
import { supabase } from '../../../../utils/supabase';

interface BoardWriteProps {
  onBack: () => void;
  onSuccess: () => void;
}

const BoardWrite: React.FC<BoardWriteProps> = ({ onBack, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // 프로필에서 닉네임 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user?.id)
      .single();

    const { error } = await supabase.from('posts').insert([
      {
        title,
        content,
        author: profile?.nickname || user?.email?.split('@')[0] || '익명',
        user_id: user?.id,
        views: 0
      }
    ]);

    if (!error) {
      onSuccess();
    } else {
      alert('글 작성에 실패했습니다: ' + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="board-write-view">
      <header className="content-header">
        <h2>새 글 작성</h2>
        <button className="back-btn" onClick={onBack}>취소</button>
      </header>
      <form className="write-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>제목</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="제목을 입력하세요"
            required 
          />
        </div>
        <div className="input-group">
          <label>내용</label>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="내용을 입력하세요"
            rows={10}
            required 
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardWrite;
