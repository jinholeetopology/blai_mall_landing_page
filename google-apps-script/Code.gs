/**
 * Google Apps Script (Web App) for landing page inquiry form -> Google Spreadsheet
 *
 * 설정 방법
 * 1) Google Spreadsheet 생성
 * 2) 확장 프로그램 > Apps Script 열기
 * 3) 이 파일 내용을 붙여넣기
 * 4) 아래 설정값 수정 (SPREADSHEET_ID / SHEET_NAME)
 * 5) 배포 > 새 배포 > 웹 앱
 *    - 실행 사용자: 나
 *    - 액세스 권한: 링크가 있는 모든 사용자
 * 6) 발급된 /exec URL을 프론트엔드 index.html의 window.APP_CONFIG.inquiryEndpoint에 입력
 */

var CONFIG = {
  SPREADSHEET_ID: "PUT_YOUR_SPREADSHEET_ID_HERE",
  SHEET_NAME: "문의목록",
  TIMEZONE: "Asia/Seoul"
};

var HEADERS = [
  "접수일시",
  "문의ID",
  "상태",
  "이름",
  "연락처",
  "회사명",
  "이메일",
  "문의유형",
  "요청사항",
  "개인정보동의",
  "페이지URL",
  "리퍼러",
  "사용자에이전트",
  "CSRF토큰",
  "원본제출시각(클라이언트)",
  "내부메모"
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: "landing-page-inquiry-sheet",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    var payload = parsePayload_(e);

    // Honeypot (스팸 방지)
    if (string_(payload.honeypot)) {
      return jsonResponse({
        ok: false,
        message: "Spam detected"
      });
    }

    var validation = validatePayload_(payload);
    if (!validation.ok) {
      return jsonResponse({
        ok: false,
        message: validation.message
      });
    }

    var sheet = getOrCreateSheet_();
    ensureHeaderRow_(sheet);

    var now = new Date();
    var inquiryId = buildInquiryId_(now);
    var row = [
      formatDate_(now),
      inquiryId,
      "신규",
      payload.name,
      payload.phone,
      payload.company,
      payload.email,
      payload.inquiryType,
      payload.message,
      payload.privacyConsent === "true" ? "동의" : "미동의",
      payload.pageUrl,
      payload.referrer,
      payload.userAgent,
      payload.csrfToken,
      payload.submittedAt,
      ""
    ];

    sheet.appendRow(row);

    return jsonResponse({
      ok: true,
      id: inquiryId,
      message: "문의가 저장되었습니다."
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      message: err && err.message ? err.message : "Unknown error"
    });
  }
}

function parsePayload_(e) {
  var params = (e && e.parameter) || {};
  // no-cors + x-www-form-urlencoded 기준 e.parameter 사용
  // (필요 시 JSON body도 추가 처리 가능)
  return {
    name: string_(params.name),
    phone: digitsOnly_(string_(params.phone)),
    company: string_(params.company),
    email: string_(params.email),
    inquiryType: string_(params.inquiryType),
    message: string_(params.message),
    privacyConsent: string_(params.privacyConsent).toLowerCase(),
    csrfToken: string_(params.csrfToken),
    honeypot: string_(params.honeypot),
    submittedAt: string_(params.submittedAt),
    pageUrl: string_(params.pageUrl),
    referrer: string_(params.referrer),
    userAgent: string_(params.userAgent)
  };
}

function validatePayload_(payload) {
  if (!payload.name) return { ok: false, message: "이름은 필수입니다." };
  if (payload.name.length < 2) return { ok: false, message: "이름은 2자 이상 입력하세요." };
  if (!/^[가-힣a-zA-Z\s]+$/.test(payload.name)) return { ok: false, message: "이름 형식이 올바르지 않습니다." };

  if (!payload.phone) return { ok: false, message: "연락처는 필수입니다." };
  if (!/^01\d{8,9}$/.test(payload.phone)) return { ok: false, message: "연락처 형식이 올바르지 않습니다." };

  if (!payload.message) return { ok: false, message: "요청사항은 필수입니다." };
  if (payload.message.length < 10) return { ok: false, message: "요청사항은 10자 이상 입력하세요." };
  if (payload.message.length > 1000) return { ok: false, message: "요청사항은 1000자 이하로 입력하세요." };

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { ok: false, message: "이메일 형식이 올바르지 않습니다." };
  }

  if (payload.privacyConsent !== "true") {
    return { ok: false, message: "개인정보 수집 및 이용 동의가 필요합니다." };
  }

  return { ok: true };
}

function getOrCreateSheet_() {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === "PUT_YOUR_SPREADSHEET_ID_HERE") {
    throw new Error("CONFIG.SPREADSHEET_ID를 설정해 주세요.");
  }
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  return sheet;
}

function ensureHeaderRow_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
}

function buildInquiryId_(date) {
  var timePart = Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyyMMdd_HHmmss");
  var rand = Math.floor(Math.random() * 9000) + 1000;
  return "INQ-" + timePart + "-" + rand;
}

function formatDate_(date) {
  return Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

function digitsOnly_(value) {
  return String(value || "").replace(/\D/g, "");
}

function string_(value) {
  return String(value || "").trim();
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
