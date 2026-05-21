// @ts-nocheck
import React, { useState, useRef } from 'react';
import { supabase } from '../../../../utils/supabase';
import { uploadPostImages, validateImageFiles } from '../board-utils';

interface BoardWriteProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface PreviewItem {
  id: string;
  file: File;
  url: string;
}

const BoardWrite: React.FC<BoardWriteProps> = ({ onBack, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const err = validateImageFiles(files);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg('');
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = 10 - previews.length;
    const toAdd = list.slice(0, remaining);

    toAdd.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, { id: `${Date.now()}-${file.name}`, file, url }]);
    });
  };

  const removePreview = (id: string) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('제목을 입력해주세요.');
      return;
    }
    if (!content.trim() && previews.length === 0) {
      setErrorMsg('내용 또는 사진 중 하나는 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg('로그인이 필요합니다.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();

    let imageUrls: string[] = [];
    try {
      if (previews.length > 0) {
        imageUrls = await uploadPostImages(
          previews.map((p) => p.file),
          user.id
        );
      }
    } catch (err) {
      setErrorMsg(err.message || '이미지 업로드에 실패했습니다.');
      setIsSubmitting(false);
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      content: content.trim(),
      author: profile?.nickname || user.email?.split('@')[0] || '익명',
      user_id: user.id,
      views: 0,
    };

    if (imageUrls.length > 0) {
      payload.image_url = imageUrls[0];
      payload.images = JSON.stringify(imageUrls);
    }

    let { error } = await supabase.from('posts').insert([payload]);

    if (error && imageUrls.length > 0) {
      const fallback = await supabase.from('posts').insert([{
        title: payload.title,
        content: payload.content,
        author: payload.author,
        user_id: payload.user_id,
        views: 0,
      }]);
      error = fallback.error;
      if (!error) {
        setErrorMsg('이미지 컬럼이 없어 글만 저장되었습니다. Supabase에 image_url, images 컬럼을 추가해주세요.');
      }
    }

    if (error) {
      setErrorMsg('글 작성에 실패했습니다: ' + error.message);
    } else {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="board-write-view">
      <form className="write-form" onSubmit={handleSubmit}>
        {errorMsg && <div className="board-alert error">{errorMsg}</div>}

        <div className="input-group">
          <label htmlFor="post-title">제목</label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={120}
          />
        </div>

        <div className="input-group">
          <label htmlFor="post-content">내용</label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={8}
          />
        </div>

        <div className="input-group">
          <label>사진 첨부 (최대 10장, 각 5MB)</label>
          <div
            className="image-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="dropzone-icon">📷</span>
            <p>클릭하거나 사진을 여기에 끌어다 놓으세요</p>
            <span className="dropzone-hint">JPG, PNG, GIF, WEBP</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {previews.length > 0 && (
            <div className="image-preview-grid">
              {previews.map((item) => (
                <div key={item.id} className="preview-item">
                  <img src={item.url} alt="미리보기" />
                  <button
                    type="button"
                    className="preview-remove"
                    onClick={() => removePreview(item.id)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="back-btn" onClick={onBack} disabled={isSubmitting}>
            취소
          </button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? '업로드 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardWrite;
