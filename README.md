# 웹페이지 안에 OS기능 구현하기
frontend : npm start
backend : ./mvnw spring-boot:run
# 💻 Mochi WebOS Full-Stack Platform

> **브라우저 환경에서 실행되는 가상 운영체제(OS) 아키텍처 기반의 개인화 웹 플랫폼**
> 
> 데스크톱 UI/UX를 웹 기술로 재해석하여 멀티 윈도우 창 매니징 시스템, 실시간 데이터 동기화 기반 애플리케이션(소셜 피드, 캘린더)을 통합 제공하는 프로젝트입니다.

---

## 🛠️ Tech Stack & Key Deliverables

📌 Frontend & UI/UX
- **React (TSX) & TypeScript**: 가상 운영체제 특유의 멀티 윈도우 매니징 시스템 구축 및 컴포넌트 단위의 정적 타입 안정성 설계
- **CSS3 Responsive Design**: GPU 가속 버그(`-webkit-mask-image` 활용)를 해결하여 팝업 패널의 미니멀 감성 라운딩 레이아웃 구현 및 가로 확장형 뷰 최적화
- **State Management**: 날짜 변경 시 오른쪽 메모장 영역의 일정이 실시간으로 새로고침되는 유연한 데이터 매핑 스위칭 기믹 구현

📌 Backend & Security
- **Spring Boot & Security**: 가상 OS 아키텍처와 연동되는 가용성 높은 RESTful API 설계 및 회원 기반 권한 분리/인증 보안 체계 강화
- **Java & Lombok**: 반복적인 보일러플레이트 코드를 최소화하여 백엔드 비즈니스 로직의 생산성과 가독성을 극대화
- **Supabase Authentication**: 세션 상태에 따른 정밀한 사용자 인증 처리 및 시작 메뉴 내 사용자 고유 닉네임 동적 바인딩 환경 구축

📌 Data, Search & External API
- **Apache Solr (Big Data Search)**: 부산 관광 정보 플랫폼 프로젝트 진행 시 공공 데이터를 효율적으로 인덱싱하여 다중 조건 고속 검색 엔진 시스템 구축
- **Supabase PostgreSQL**: 날짜별 일정 데이터 및 커뮤니티 데이터를 영속적으로 관리하고, 데이터 무결성을 위한 외래키(FK) 릴레이션 및 RLS(Row Level Security) 보안 정책 적용
- **External Data APIs**: 주식 모의 투자 게임 및 외부 금융 API 데이터 파싱 기법을 도입하여 실시간 자산 포트폴리오 관리 피드 구현

📌 DevOps & Team Leadership
- **Docker & AWS EC2**: 인프라 환경에 구애받지 않는 가상화 컨테이너 서버를 빌드하고 AWS 클라우드 배포를 통해 서비스 가용성 확보
- **Git / GitHub (Conflict Resolution)**: 팀 프로젝트 진행 시 활성화되지 않은 팀원들을 독려하고 복잡한 소스코드 충돌을 주도적으로 조율하여 프로젝트 완성도를 견인
- **Project Achievements**: K-Sea AI Challenge 2025 본선에 진출하여 해양/선박 환경 최적화 기능을 개발하며 실무 웹 풀스택 역량을 검증받음

---

## 🏁 Trouble Shooting & Core Optimization

### 1. CSS 3D 가속 및 GPU 렌더링 시 시작 메뉴 모서리 깨짐 해결
- **문제 상황**: 시작 메뉴 팝업 등장 애니메이션(`@keyframes slideUp`) 실행 시, 브라우저가 요소를 다시 그리며 부모의 `border-radius`와 `overflow: hidden`을 무시하고 자식 요소가 각지게 가려지는 그래픽 깨짐 현상 직면.
- **해결 방안**: 하드웨어 가속 중에도 모서리 픽셀이 자식 요소를 완전히 가두도록 하단 하드웨어 가속 치트키 속성을 덧붙여 브라우저 렌더링 버그를 근본적으로 제어.
  ```css
  .start-menu-container {
    will-change: transform, opacity;
    transform-style: preserve-3d;
    -webkit-mask-image: -webkit-radial-gradient(white, black);
  }
