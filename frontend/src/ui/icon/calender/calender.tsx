// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CiCirclePlus } from 'react-icons/ci';
import './calender.css';
import { supabase } from '../../../utils/supabase'; // 프로젝트 내부 Supabase 인스턴스 경로 확인 필요

interface TodoItem {
  id: string; // Supabase UUID 매핑
  text: string;
  isCompleted: boolean;
}

interface MonthlyTodos {
  [dateStr: string]: TodoItem[];
}

interface CalenderProps {
  onClose?: () => void;
}

const Calender: React.FC<CalenderProps> = ({ onClose = () => {} }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  );
  
  // 전체 날짜별 일정 상태 관리
  const [allTodos, setAllTodos] = useState<MonthlyTodos>({});
  const [taskText, setTaskText] = useState<string>("");
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const [mode, setMode] = useState<"add" | "mod" | "del" | "alert">("add");

  const currentDayTodos = allTodos[selectedDateStr] || [];

  // 🌟 [READ] 컴포넌트 마운트 시 Supabase에서 로그인한 유저의 전체 일정 데이터 조회
  useEffect(() => {
    const fetchAllTodos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_todos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("일정 로드 실패:", error.message);
        return;
      }

      // 수신한 단일 테이블 리스트 데이터를 { "YYYY-MM-DD": [...] } 맵 형태로 가공 파싱
      const todoMap: MonthlyTodos = {};
      data.forEach((row: any) => {
        if (!todoMap[row.date_str]) {
          todoMap[row.date_str] = [];
        }
        todoMap[row.date_str].push({
          id: row.id,
          text: row.task_text,
          isCompleted: row.is_completed
        });
      });
      setAllTodos(todoMap);
    };

    fetchAllTodos();
  }, []);

  // 🌟 [CUD] 할 일 추가 / 수정 / 삭제 모달 통합 핸들러
  const handleAddOrUpdateTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!taskText.trim().length && mode !== "del") {
      setMode("alert");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedTodos = { ...allTodos };
    if (!updatedTodos[selectedDateStr]) {
      updatedTodos[selectedDateStr] = [];
    }

    if (mode === "add") {
      // Supabase Insert 수행
      const { data, error } = await supabase
        .from('calendar_todos')
        .insert([
          { 
            user_id: user.id, 
            date_str: selectedDateStr, 
            task_text: taskText, 
            is_completed: false 
          }
        ])
        .select()
        .single();

      if (error) {
        alert("추가 실패: " + error.message);
        return;
      }

      // DB 저장이 성공하면 반환된 실제 id 기반으로 화면 상태 동기화
      updatedTodos[selectedDateStr].push({
        id: data.id,
        text: data.task_text,
        isCompleted: data.is_completed
      });

    } else if (mode === "mod") {
      // Supabase Update 수행
      const { error } = await supabase
        .from('calendar_todos')
        .update({ task_text: taskText })
        .eq('id', activeTodoId);

      if (error) {
        alert("수정 실패: " + error.message);
        return;
      }

      updatedTodos[selectedDateStr] = updatedTodos[selectedDateStr].map(todo =>
        todo.id === activeTodoId ? { ...todo, text: taskText } : todo
      );

    } else if (mode === "del") {
      // Supabase Delete 수행
      const { error } = await supabase
        .from('calendar_todos')
        .delete()
        .eq('id', activeTodoId);

      if (error) {
        alert("삭제 실패: " + error.message);
        return;
      }

      updatedTodos[selectedDateStr] = updatedTodos[selectedDateStr].filter(todo => todo.id !== activeTodoId);
    }

    setAllTodos(updatedTodos);
    setTaskText("");
    setModalOpen(false);
  };

  // 🌟 [UPDATE] 체크박스 완료 상태 토글 함수
  const toggleTodoComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('calendar_todos')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (error) {
      alert("상태 변경 실패: " + error.message);
      return;
    }

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

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayInstance = new Date(year, month, 1);
    const startDayOfWeek = firstDayInstance.getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) daysArray.push(null);
    for (let day = 1; day <= totalDaysInMonth; day++) daysArray.push(new Date(year, month, day));
    return daysArray;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (isModalOpen) setModalOpen(false);
        else onClose();
      } else if (e.code === "Enter" && isModalOpen && mode !== "alert") {
        handleAddOrUpdateTodo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [taskText, mode, isModalOpen]);

  return (
    <div className="calendar-todo-container" style={{ display: 'flex', gap: '20px', padding: '20px', height: '100%', boxSizing: 'border-box' }}>
      {/* 좌측: 달력 그리드 스코프 */}
      <div className="calendar-left-box" style={{ flex: 1.2, background: '#fff', padding: '15px', borderRadius: '20px', border: '2px solid #FFDEE9' }}>
        <div className="calendar-nav-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={() => changeMonth('prev')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>◀</button>
          <h3 style={{ margin: 0 }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
          <button onClick={() => changeMonth('next')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>▶</button>
        </div>

        <div className="calendar-week-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', fontSize: '12px', color: '#888' }}>
          <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
        </div>

        <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '10px', textAlign: 'center' }}>
          {generateCalendarDays().map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            
            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDateStr;
            const hasItems = (allTodos[dateStr] || []).length > 0;
            const isAllDone = hasItems && (allTodos[dateStr] || []).every(t => t.isCompleted);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                style={{
                  padding: '10px 0', borderRadius: '12px', cursor: 'pointer', fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  background: isSelected ? '#FFDEE9' : 'transparent', position: 'relative'
                }}
              >
                {day.getDate()}
                {hasItems && (
                  <span style={{
                    position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                    width: '5px', height: '5px', border_radius: '50%',
                    background: isAllDone ? '#4ec0a6' : '#ff66aa'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측: To-Do 메모 리스트 스코프 */}
      <div className="todo-right-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', padding: '15px', borderRadius: '20px', border: '1px solid #ddd' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📌 {selectedDateStr} 일정</h4>
        
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
                    onChange={() => toggleTodoComplete(todo.id, todo.isCompleted)} // 파라미터 매핑 수정
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

        <div className="add-todo-trigger" onClick={() => openModal(null, "add")} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', background: '#B5FFFC', borderRadius: '12px', justifyContent: 'center' }}>
          <CiCirclePlus size={20} />
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>할 일 추가</span>
        </div>
      </div>

      {/* 조작 제어용 백드롭 모달 영역 */}
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