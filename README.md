# 상상토끼 폰틀리에 — AI 폰트 추천 & 미리보기 위젯

상상토끼 폰트 쇼핑몰(sangsangfont.com)에 삽입 가능한 독립형 웹 위젯입니다.

## 핵심 기능

1. **AI 폰트 추천** — 용도/분위기를 입력하면 Claude AI가 최적 폰트 3종 추천
2. **폰트 미리보기** — 원하는 문장을 입력해 전체 폰트로 실시간 렌더링

## 사용 방법

### 로컬 테스트

`index.html`을 브라우저에서 직접 열면 됩니다.

### 아임웹 삽입 방법

1. `index.html` 파일을 웹 호스팅에 업로드합니다 (예: Netlify, Vercel, 자체 서버)
2. 아임웹 관리자 → 페이지 편집 → **코드 삽입 위젯** 추가
3. 아래 iframe 코드를 붙여넣기:

```html
<iframe
  src="https://your-domain.com/fontelier-widget/index.html"
  width="100%"
  height="800"
  frameborder="0"
  style="border:none; max-width:800px; margin:0 auto; display:block;"
></iframe>
```

4. `your-domain.com` 부분을 실제 호스팅 주소로 변경

### API 키 설정

AI 추천 기능을 사용하려면 Anthropic Claude API 키가 필요합니다.

1. 위젯 상단 ⚙️ API 키 설정 클릭
2. `sk-ant-...` 형식의 API 키 입력 후 저장
3. 키는 브라우저 sessionStorage에만 저장되며 탭을 닫으면 삭제됩니다

## 기술 스택

- 단일 HTML 파일 (빌드 불필요)
- Google Fonts (한글 대체 폰트 렌더링)
- Anthropic Claude API (claude-sonnet-4-6)
- 순수 Vanilla JS, CSS Variables
- 모바일 반응형 지원
