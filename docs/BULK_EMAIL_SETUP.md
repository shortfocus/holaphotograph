# 강의 신청 목록 - 메일 일괄 발송 (Resend)

관리자 페이지 **강의 신청 목록**에서 수신자에게 이메일을 일괄 발송할 수 있습니다. [Resend](https://resend.com) API를 사용합니다.

## 1. Resend 가입 및 API 키 발급

1. [resend.com](https://resend.com) 가입
2. **API Keys** → **Create API Key** 로 키 발급 (예: `re_xxxx`)
3. 발신 도메인 검증: **Domains**에서 사용할 도메인 추가 후 DNS 레코드 설정 (예: `noreply@yourdomain.com`)

무료 티어: 월 약 3,000통.

## 2. Cloudflare Worker 시크릿 설정

```bash
cd worker

# Resend API 키
npx wrangler secret put RESEND_API_KEY
# 프롬프트에 발급한 키 입력 (예: re_xxxx)

# 발신 이메일 (Resend에서 검증한 도메인)
npx wrangler secret put RESEND_FROM
# 예: noreply@holaphotograph.com 또는 "올라포토 <noreply@yourdomain.com>"
```

설정 후 Worker 재배포가 필요합니다.

## 3. 사용 방법

1. 관리자로 로그인 후 **강의 신청 목록** 페이지 이동
2. **메일 일괄 발송** 버튼 클릭
3. 모달에서 제목·본문 입력
4. **전체 발송**: 테이블에서 아무도 선택하지 않으면 등록된 전체 수신자에게 발송
5. **선택 발송**: 테이블 각 행의 체크박스로 수신자 선택 후 발송

본문은 일반 텍스트이며, 줄바꿈은 이메일에서 `<br>`로 변환됩니다.
