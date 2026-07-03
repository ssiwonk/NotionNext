/**
 * 웹사이트 글꼴 관련 설정
 *
 */
module.exports = {
  // START ************웹사이트 글꼴*****************
  // ['font-serif','font-sans'] 두 가지 중 선택 가능, 각각 세리프(바탕체)와 산세리프(고딕체)입니다.
  // 뒤에 공백으로 구분된 font-light 등은 글꼴 두께이며, 비워두면 기본 두께로 설정됩니다.
  FONT_STYLE: process.env.NEXT_PUBLIC_FONT_STYLE || 'font-sans font-light',
  
  // 글꼴 CSS 주소 설정 (프리텐다드 웹폰트를 1순위로 추가했습니다)
  FONT_URL: [
    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css',
    'https://fonts.googleapis.com/css?family=Bitter:300,400,700&display=swap',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700&display=swap'
  ],

  // 글꼴 최적화 설정
  FONT_DISPLAY: process.env.NEXT_PUBLIC_FONT_DISPLAY || 'swap',
  FONT_PRELOAD: process.env.NEXT_PUBLIC_FONT_PRELOAD || true,
  FONT_SUBSET: process.env.NEXT_PUBLIC_FONT_SUBSET || 'korean',
  
  // 산세리프(고딕) 글꼴 기본 순위 (Pretendard를 최우선 순위로 지정했습니다)
  FONT_SANS: [
    'Pretendard',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans KR"',
    '"Apple SD Gothic Neo"',
    '"맑은 고딕"',
    'Malgun Gothic',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"'
  ],
  
  // 세리프(바탕체) 글꼴 기본 순위
  FONT_SERIF: [
    'Bitter',
    '"Noto Serif KR"',
    '"조선일보명조"',
    'ChosunMyeongjo',
    '"바탕"',
    'Batang',
    '"Times New Roman"',
    'Times',
    'serif',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Apple Color Emoji"'
  ],
  
  // font-awesome 폰트 아이콘 주소
  FONT_AWESOME:
    process.env.NEXT_PUBLIC_FONT_AWESOME_PATH ||
    '/vendor/fontawesome/css/all.min.css'

  // END ************웹사이트 글꼴*****************
}
