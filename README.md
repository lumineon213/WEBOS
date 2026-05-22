# 웹페이지 안에 OS기능 구현하기
frontend : npm start
backend : ./mvnw spring-boot:run
# 💻 Mochi WebOS

> **브라우저 환경에서 실행되는 가상 운영체제(OS) 아키텍처 기반의 풀스택 웹 플랫폼**
> 
> 데스크톱 UI/UX를 웹 기술로 재해석하여 멀티 윈도우 창 매니징 시스템, 실시간 데이터 동기화 기반 애플리케이션(소셜 피드, 캘린더)을 통합 제공하는 개인화 플랫폼입니다.

---

## 🛠️ Tech Stack

### Frontend
- **Framework & Language:** React (TSX), TypeScript
- **Styling:** CSS3 (미니멀 아날로그 감성 테마)

### Backend & Database
- **Framework & Language:** Spring Boot, Java, Python
- **BaaS (Backend as a Service):** Supabase (인증 및 실시간 데이터 인프라)
- **Search Engine:** Apache Solr (대용량 인덱싱 및 다중 조건 검색 엔진 연동)

---

## 🚀 Key Features

### 1. 가상 데스크톱 & 멀티 윈도우 시스템
- 드래그 앤 드롭 및 레이어 z-index 제어를 통한 독립적인 윈도우 프레임 매니징 기능.
- 사용자 맞춤형 시작 메뉴(Start Menu)를 통해 실시간 로그인 세션의 유저 닉네임 유동적 바인딩.

### 2. 소셜 보드 (𝕏 및 에펨코리아 하이브리드 피드)
- 트위터(𝕏) 스타일의 반응형 타임라인 뷰 모드 제공.
- 대용량 커뮤니티(에펨코리아) 스타일의 PC 게시판 뷰 및 **독립형 하단 페이징 바(20개 슬라이싱 렌더링)** 아키텍처 구현.
- Supabase 기반 실시간 추천(좋아요) 및 답글 스레드 동기화.

### 3. 미니멀 감성 캘린더 & To-Do 모듈
- 순수 JavaScript Date 객체 제어 알고리즘을 활용한 테두리 없는 미니멀 캘린더 그리드 생성.
- 아날로그 줄공책 디자인 스코프를 이식한 날짜별 독립적 투두 리스트 바인딩.
- Supabase CRUD 연동을 통한 일정 영속성 관리 및 RLS(Row Level Security) 적용.

---

## 🏁 Trouble Shooting & Optimization

### 1. CSS 3D 가속 및 GPU 렌더링 시 모서리 깨짐 버그 해결
- **문제 상황:** 시작 메뉴 팝업 등장 애니메이션(`@keyframes slideUp`) 실행 시, 브라우저가 요소를 다시 그리며 부모의 `border-radius`와 `overflow: hidden`을 순간적으로 무시하고 자식 요소가 각지게 튀어나오는 그래픽 깨짐 현상 발생.
- **해결 방안:** 하드웨어 가속 중에도 레이아웃을 고정하도록 하단 속성을 도입하여 완벽하게 제어.
  ```css
  .start-menu-container {
    will-change: transform, opacity;
    transform-style: preserve-3d;
    -webkit-mask-image: -webkit-radial-gradient(white, black); /* 자식 픽셀 탈출 방지 치트키 */
  }
