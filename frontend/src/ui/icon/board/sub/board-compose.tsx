// @ts-nocheck
import React, { useState, useRef } from 'react';
import { supabase } from '../../../../utils/supabase';
import { uploadPostImages, validateImageFiles, createPost } from '../board-utils';

interface BoardComposeProps {
  onPosted: () => void;
  placeholder?: string;
  compact?: boolean;
  parentId?: number | null;
  onCancel?: () => void;
}

const BoardCompose: React.FC<BoardComposeProps> = ({
  onPosted,
  placeholder = '무슨 일이 일어나고 있나요?',
  compact = false,
  parentId = null,
  onCancel,
}) => {
  const [content, setContent] = useState('');
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [myAvatar, setMyAvatar] = useState('');
  const fileRef = useRef(null);
  const maxLen = 280;

  React.useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
      if (data?.avatar_url) setMyAvatar(data.avatar_url);
    });
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const err = validateImageFiles(files);
    if (err) { setError(err); return; }
    setError('');
    Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 4 - previews.length).forEach((file) => {
      setPreviews((prev) => [...prev, { id: `${Date.now()}-${file.name}`, file, url: URL.createObjectURL(file) }]);
    });
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text && previews.length === 0) {
      setError('내용을 입력하거나 사진을 추가해주세요.');
      return;
    }
    if (text.length > maxLen) {
      setError(`${maxLen}자 이하로 작성해주세요.`);
      return;
    }

    setSubmitting(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('로그인이 필요합니다.');
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    let imageUrls = [];
    try {
      if (previews.length) imageUrls = await uploadPostImages(previews.map((p) => p.file), user.id);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
      return;
    }

    const { error: postErr } = await createPost({
      userId: user.id,
      author: profile?.nickname || user.email?.split('@')[0] || '익명',
      content: text,
      parentId,
      imageUrls,
    });

    setSubmitting(false);
    if (postErr) {
      setError(postErr);
      return;
    }

    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setContent('');
    setPreviews([]);
    onPosted();
    onCancel?.();
  };

  return (
    <div className={`x-compose ${compact ? 'compact' : ''} ${parentId ? 'reply' : ''}`}>
      <div className="x-compose-inner">
        <div className="x-compose-avatar">
          {myAvatar ? <img src={myAvatar} alt="" /> : <span>🍡</span>}
        </div>
        <div className="x-compose-body">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={compact ? 2 : 3}
            maxLength={maxLen + 50}
          />
          {previews.length > 0 && (
            <div className="x-compose-previews">
              {previews.map((p) => (
                <div key={p.id} className="x-preview-item">
                  <img src={p.url} alt="" />
                  <button type="button" onClick={() => {
                    URL.revokeObjectURL(p.url);
                    setPreviews((prev) => prev.filter((x) => x.id !== p.id));
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {error && <p className="x-compose-error">{error}</p>}
          <div className="x-compose-actions">
            <div className="x-compose-tools">
              <button type="button" className="x-tool-btn" title="사진" onClick={() => fileRef.current?.click()}>🖼️</button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = '';
              }} />
              <span className={`x-char-count ${content.length > maxLen ? 'over' : ''}`}>
                {content.length > 0 && `${content.length}/${maxLen}`}
              </span>
            </div>
            <div className="x-compose-btns">
              {onCancel && (
                <button type="button" className="x-btn-ghost" onClick={onCancel}>취소</button>
              )}
              <button
                type="button"
                className="x-btn-post"
                disabled={submitting || (!content.trim() && !previews.length)}
                onClick={handleSubmit}
              >
                {submitting ? '게시 중…' : parentId ? '답글' : '게시하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardCompose;
