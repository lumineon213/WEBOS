// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../utils/supabase';

interface BoardDetailProps {
  postId: number;
  onBack: () => void;
}

const BoardDetail: React.FC<BoardDetailProps> = ({ postId, onBack }) => {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (data) {
        setPost(data);
        // 조회수 증가 로직 (선택 사항)
        await supabase
          .from('posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', postId);
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId]);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!post) return <div className="error">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="board-detail-view">
      <header className="content-header">
        <button className="back-btn" onClick={onBack}>← 목록으로</button>
        <h2>{post.title}</h2>
      </header>
      <div className="post-meta">
        <span>작성자: {post.author}</span>
        <span>날짜: {new Date(post.created_at).toLocaleDateString()}</span>
        <span>조회수: {post.views}</span>
      </div>
      <div className="post-content-body">
        {post.content}
      </div>
    </div>
  );
};

export default BoardDetail;