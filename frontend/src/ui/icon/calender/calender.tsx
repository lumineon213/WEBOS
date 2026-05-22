import React, { useState, useEffect } from 'react';
import { CiCirclePlus } from 'react-icons/ci';

// 1. 데이터 모델 정의
interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

// 날짜별로 Todo 배열을 관리하는 객체 구조 (예: { "2026-05-22": [...] })
interface MonthlyTodos {
  [dateStr: string]: TodoItem[];
}

interface CalenderProps {
  onClose?: () => void;
}

const Calender: React.FC<CalenderProps> = ({ onClose = () => {} }) => {
  // 2. 상태(State) 관리
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); // 현재 달력의 기준 년/월
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0] // 오늘 날짜 기본 선택 ("YYYY-MM-DD")
  );
  
  // 전체 날짜별 투두 저장소
  const [allTodos, setAllTodos] = useState<MonthlyTodos>({
    "2026-05-22": [
      { id: "1", text: "Mochi OS 기능 테스트하기", isCompleted: false },
      { id: "2", text: "GangHyun95 달력 알고리즘 이식", isCompleted: true }
    ]
  });

  const [taskText, setTaskText] = useState<string>("");
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const [mode, setMode] = useState<"add" | "mod" | "del" | "alert">("add");

  // 현재 선택된 날짜의 할 일 목록만 쏙 뽑아오기
  const currentDayTodos = allTodos[selectedDateStr] || [];

  // 3. 달력 그리드 생성 함수 (GangHyun95 소스의 Date 핵심 알고리즘 기반)
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayInstance = new Date(year, month, 1);
    const startDayOfWeek = firstDayInstance.getDay(); // 1일의 시작 요일 (0: 일요일 ~ 6: 토요일)
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate(); // 이번 달 총 일수

    const daysArray: (Date | null)[] = [];

    // 1일 시작 전 빈 공백 채우기
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }

    // 실제 날짜 채우기
    for (let day = 1; day <= totalDaysInMonth; day++) {
      daysArray.push(new Date(year, month, day));
    }

    return daysArray;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  // 4. To-Do List CRUD 로직 및 모달 제출 핸들러
  const handleAddOrUpdateTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!taskText.trim().length && mode !== "del") {
      setMode("alert");
      return;
    }

    // 깊은 복사로 상태 불변성 유지
    const updatedTodos = { ...allTodos };
    if (!updatedTodos[selectedDateStr]) {
      updatedTodos[selectedDateStr] = [];
    }

    if (mode === "add") {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: taskText,
        isCompleted: false
      };
      updatedTodos[selectedDateStr].push(newTodo);
    } else if (mode === "mod") {
      updatedTodos[selectedDateStr] = updatedTodos[selectedDateStr].map(todo =>
        todo.id === activeTodoId ? { ...todo, text: taskText } : todo
      );
    } else if (mode === "del") {
      updatedTodos[selectedDateStr] = updatedTodos[selectedDateStr].filter(todo => todo.id !== activeTodoId);
    }

    setAllTodos(updatedTodos);
    setTaskText("");
    setModalOpen(false);
  };

  // 체크박스 완료 여부 토글 함수
  const toggleTodoComplete = (id: string) => {
    const updatedTodos = { ...allTodos };
    updatedTodos[selectedDateStr] = updatedTodos[selectedDateStr].map(todo =>
      todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
    );
    setAllTodos(updatedTodos);
  };

  const openModal = (id: string | null, selectedMode: "add" | "mod" | "del", currentText: string = "") => {
    setActiveTodoId(id);
    setMode(selectedMode);
    setTaskText(currentText);
    setModalOpen(true);
  };

  // 5. ESC, Enter 단축키 감지 훅 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (isModalOpen) setModalOpen(false);
        else onClose(); // 모달이 없으면 윈도우 창 닫기
      } else if (e.code === "Enter" && isModalOpen && mode !== "alert") {
        handleAddOrUpdateTodo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [taskText, mode, isModalOpen]);

  return (
    <div className="calendar-todo-container" style={{ display: 'flex', gap: '20px', padding: '20px', height: '100%', boxSizing: 'border-box' }}>
      
      {/* 왼쪽: 달력 영역 */}
      <div className="calendar-left-box" style={{ flex: 1.2, background: '#fff', padding: '15px', borderRadius: '20px', border: '2px solid #FFDEE9' }}>
        <div className="calendar-nav-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={() => changeMonth('prev')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>◀</button>
          <h3 style={{ margin: 0 }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
          <button onClick={() => changeMonth('next')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>▶</button>
        </div>

        {/* 요일 헤더 */}
        <div className="calendar-week-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px', fontSize: '12px', color: '#888' }}>
          <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
        </div>

        {/* 날짜 그리드 */}
        <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '10px', textAlign: 'center' }}>
          {generateCalendarDays().map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDateStr;
            const hasItems = (allTodos[dateStr] || []).length > 0;
            const isAllDone = hasItems && (allTodos[dateStr] || []).every(t => t.isCompleted);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                style={{
                  padding: '10px 0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  background: isSelected ? '#FFDEE9' : 'transparent',
                  position: 'relative',
                  transition: '0.2s'
                }}
              >
                {day.getDate()}
                {/* 할 일이 등록되어 있을 때 표시되는 앵두 표시 포인트 */}
                {hasItems && (
                  <span style={{
                    position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: isAllDone ? '#4ec0a6' : '#ff66aa'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 줄공책 모양 To-Do List 영역 */}
      <div className="todo-right-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', padding: '15px', borderRadius: '20px', border: '1px solid #ddd' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📌 {selectedDateStr} 일정</h4>
        
        {/* 줄공책 디자인의 리스트 피드 스코프 */}
        <div className="notebook-lines" style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
          {currentDayTodos.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', marginTop: '30px' }}>지정된 할 일이 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {currentDayTodos.map(todo => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #ccc', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => toggleTodoComplete(todo.id)}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <span style={{ flex: 1, textDecoration: todo.isCompleted ? 'line-through' : 'none', color: todo.isCompleted ? '#aaa' : '#333' }}>
                    {todo.text}
                  </span>
                  <button onClick={() => openModal(todo.id, "mod", todo.text)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>⚙️</button>
                  <button onClick={() => openModal(todo.id, "del")} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'red' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 추가 인터페이스 */}
        <div className="add-todo-trigger" onClick={() => openModal(null, "add")} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#B5FFFC', borderRadius: '12px', justifyContent: 'center' }}>
          <CiCirclePlus size={20} />
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>할 일 추가</span>
        </div>
      </div>

      {/* 조작용 독립 팝업 모달 */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content-card" style={{ background: '#fff', padding: '20px', borderRadius: '20px', width: '300px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <form onSubmit={handleAddOrUpdateTodo}>
              {mode === "alert" ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 'bold' }}>할 일의 텍스트를 입력해 주세요!</p>
                  <button type="button" onClick={() => setMode("add")} style={{ width: '100%', padding: '8px', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>돌아가기</button>
                </div>
              ) : mode === "del" ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px' }}>정말로 이 일정을 삭제할까요?</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button type="submit" style={{ flex: 1, padding: '8px', border: 'none', background: '#ff66aa', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>삭제</button>
                    <button type="button" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '8px', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>취소</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h5 style={{ margin: '0 0 10px 0' }}>{mode === "add" ? "새 일정 추가" : "일정 편집"}</h5>
                  <input
                    type="text"
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    placeholder="할 일 내용을 입력하세요"
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '15px' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{ flex: 1, padding: '8px', border: 'none', background: '#B5FFFC', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>
                      {mode === "add" ? "추가" : "수정"}
                    </button>
                    <button type="button" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '8px', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>취소</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calender;