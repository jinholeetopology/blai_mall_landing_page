# Google Spreadsheet 문의 저장 연동 가이드

이 프로젝트는 `Google Apps Script Web App`을 통해 문의 데이터를 Google Spreadsheet에 저장할 수 있습니다.

## 1. Google Spreadsheet 준비

1. 구글 드라이브에서 새 스프레드시트 생성
2. 시트 이름은 기본값으로 두거나, Apps Script 설정과 동일하게 맞춤 (기본: `문의목록`)
3. 스프레드시트 URL에서 ID 복사
   - 예: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0`

## 2. Apps Script 배포

1. 스프레드시트에서 `확장 프로그램 > Apps Script` 열기
2. `/Users/jinholee/landing_page/google-apps-script/Code.gs` 내용 붙여넣기
3. `CONFIG.SPREADSHEET_ID` 값을 실제 스프레드시트 ID로 변경
4. 저장
5. `배포 > 새 배포 > 웹 앱`
6. 설정
   - 실행 사용자: `나`
   - 액세스 권한: `링크가 있는 모든 사용자`
7. 배포 후 발급된 `.../exec` URL 복사

## 3. 프론트엔드 설정

`/Users/jinholee/landing_page/index.html` 하단의 `window.APP_CONFIG`를 수정합니다.

```html
<script>
  window.APP_CONFIG = {
    inquiryProvider: "google-apps-script",
    inquiryEndpoint: "https://script.google.com/macros/s/발급받은값/exec",
    inquiryEndpointMode: "no-cors"
  };
</script>
```

## 4. 테스트

1. 로컬 서버 실행
   ```bash
   cd /Users/jinholee/landing_page
   source .venv/bin/activate
   python -m http.server 5500
   ```
2. [http://localhost:5500](http://localhost:5500) 접속
3. 문의하기 제출
4. 스프레드시트에 새 행이 추가되는지 확인

## 5. 운영 권장사항

- Apps Script 공개 웹앱은 스팸에 취약할 수 있으므로 `reCAPTCHA` 추가 권장
- 스프레드시트 공유 권한 최소화 (편집자 제한)
- 개인정보 보유기간 정책에 맞춰 주기적 삭제/마스킹 처리
- 향후 운영 규모가 커지면 DB(PostgreSQL/MySQL)로 이전 권장

## 참고

- 현재 프론트엔드는 `no-cors` 모드로 전송하므로, 네트워크 오류가 없으면 성공으로 간주합니다.
- 서버 측 상세 오류코드까지 프론트에서 직접 읽고 싶다면 별도 백엔드 API 프록시 구성이 필요합니다.
