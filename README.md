# Outsourcing Pro - B2B 아웃소싱 매칭 플랫폼 랜딩 페이지

기업 맞춤형 IT, 디자인, 마케팅, AI 아웃소싱을 빠르고 안정적으로 연결하는 B2B 전문 파트너 **Outsourcing Pro**의 공식 랜딩 페이지입니다. 반응형 웹 환경을 지원하며, 사용자의 접근성을 고려한 UI/UX와 실제 비즈니스 리드 수집을 위한 문의 폼이 구축되어 있습니다.

## 🚀 주요 기능

- **반응형 웹 디자인**: 모바일, 태블릿, 데스크탑 등 다양한 기기에 최적화된 레이아웃 제공
- **서비스 소개 및 포트폴리오**: IT 개발, 디자인, 마케팅, AI 등 분야별 서비스 카테고리 및 실제 성공 사례 슬라이더 기능
- **통계 및 프로세스 소개**: 운영 성과를 보여주는 숫자 애니메이션 및 4단계 서비스 프로세스 안내
- **실시간 문의 폼 연동**: 웹상에서 들어온 상담 문의를 **Google Spreadsheet**로 자동 수집 및 연동 (Google Apps Script 활용)
- **접근성(a11y) 고려**: 스크린 리더 지원(aria 속성), 키보드 내비게이션 최적화
- **SEO 마크업**: 검색 엔진 최적화를 위한 메타 태그 및 Schema.org 구조화 데이터 포함

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3 (Vanilla CSS), Vanilla JavaScript
- **Backend (Serverless)**: Google Apps Script (문의 데이터 처리 및 저장 API 기능)
- **Database**: Google Spreadsheet
- **Dev/Server**: Python 3.x `http.server` (로컬 개발 환경용)

## 📁 주요 파일 및 폴더 구조

```text
landing_page/
├── index.html                  # 메인 랜딩 페이지 (시맨틱 마크업)
├── styles.css                  # 전체 스타일링 (디자인 시스템 적용)
├── script.js                   # UI 인터랙션 및 문의 폼 제출 로직
├── google-apps-script/
│   └── Code.gs                 # 구글 앱스 스크립트 (백엔드 웹앱 코드)
├── GOOGLE_SHEETS_SETUP.md      # 구글 스프레드시트 문의 연동 가이드
├── 실행방법.txt                  # 로컬 서버 실행 안내 문서
└── README.md                   # 프로젝트 개요 및 안내 (현재 문서)
```

## ⚙️ 설치 및 실행 방법

본 프로젝트는 순수 HTML, CSS, JS로 구성되어 있어 브라우저에서 `index.html`을 직접 열어도 동작합니다.
하지만 문의 폼 제출 등 AJAX/Fetch API 테스트를 위해 로컬 서버 환경에서 실행하는 것을 권장합니다.

1. **저장소 클론 및 디렉토리 이동**
   ```bash
   git clone <repository-url>
   cd landing_page
   ```

2. **(선택) 가상환경 활성화 (Python 프로젝트일 경우)**
   ```bash
   source .venv/bin/activate
   ```

3. **로컬 서버 실행**
   ```bash
   python -m http.server 5500
   ```

4. **웹 브라우저 접속**
   - 주소창에 [http://localhost:5500](http://localhost:5500) 입력 후 접속

## 📊 Google Spreadsheet 문의 데이터 연동 (필수)

사용자가 랜딩 페이지에서 문의하기 양식을 제출할 때, 그 데이터를 구글 스프레드시트로 자동 저장하려면 별도의 셋업이 필요합니다.

자세한 설정 방법은 프로젝트 내 동봉된 [**`GOOGLE_SHEETS_SETUP.md`**](./GOOGLE_SHEETS_SETUP.md) 파일을 참조해 주세요.

> **요약:** 구글 스프레드시트를 생성하고, `google-apps-script/Code.gs` 코드를 Apps Script에 붙여넣은 뒤 웹 앱으로 배포합니다. 발급받은 URL을 `index.html` 하단 `window.APP_CONFIG.inquiryEndpoint` 에 설정하면 활성화됩니다.

## 📝 라이선스

이 프로젝트는 지정된 용도 및 회사 웹사이트 내에서만 사용 가능합니다.
무단 복제 및 상업적 재배포를 금지합니다.
