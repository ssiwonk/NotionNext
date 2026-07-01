// 참고: process.env.XX는 Vercel의 환경 변수입니다. 설정 방법은 다음을 참조하세요: https://docs.tangly1024.com/article/how-to-config-notion-next#c4768010ae7d44609b744e79e2f9959a

const BLOG = {
  API_BASE_URL: process.env.API_BASE_URL || 'https://www.notion.so/api/v3', // API 기본 요청 주소, 본인의 주소로 설정할 수 있습니다. 예: https://[xxxxx].notion.site/api/v3
  // 중요 page_id！！！ 다음 링크에서 템플릿을 복제하세요: https://tanghh.notion.site/02ab3b8678004aa69e9e415905ef32a5
  NOTION_PAGE_ID:
    process.env.NOTION_PAGE_ID ||
    '02ab3b8678004aa69e9e415905ef32a5,en:7c1d570661754c8fbc568e00a01fd70e',
  THEME: process.env.NEXT_PUBLIC_THEME || 'gitbook', // 현재 테마, themes 폴더에서 지원하는 모든 테마를 확인할 수 있습니다. 테마 이름은 폴더 이름과 같습니다. 예: claude,endspace,example,fukasawa,fuwari,gitbook,heo,hexo,landing,matery,medium,next,nobelium,plog,simple
  LANG: process.env.NEXT_PUBLIC_LANG || 'ko', // 기본 언어를 한국어('ko')로 변경했습니다. 자세한 내용은 /lib/lang.js 참조.
  SINCE: process.env.NEXT_PUBLIC_SINCE || 2026, // 사이트 시작 연도. 비워두면 현재 연도가 사용됩니다.

  PSEUDO_STATIC: process.env.NEXT_PUBLIC_PSEUDO_STATIC || false, // 가상 정적 경로(Pseudo-static path), 활성화 시 모든 글의 URL이 .html로 끝납니다.
  NEXT_REVALIDATE_SECOND: process.env.NEXT_PUBLIC_REVALIDATE_SECOND || 60, // 캐시 갱신 간격 단위(초); 즉, 각 페이지는 60秒 동안 정적 상태로 유지되며, 이 기간 동안 아무리 많이 방문해도 노션 데이터를 새로 가져오지 않습니다. 이 값을 늘리면 Vercel 자원을 절약하고 방문 속도를 높일 수 있지만, 글 업데이트에 지연이 발생할 수 있습니다.
  REVALIDATION_TOKEN: process.env.REVALIDATION_TOKEN || '', // On-Demand Revalidation Token, 설정 시 POST /api/revalidate를 통해 즉시 페이지 캐시를 새로고침할 수 있습니다 (노션 콘텐츠 업데이트 지연 문제 해결)
  APPEARANCE: process.env.NEXT_PUBLIC_APPEARANCE || 'light', // ['light', 'dark', 'auto'], // light 라이트 모드, dark 다크 모드, auto 시간 및 테마에 따라 자동으로 다크 모드 전환
  APPEARANCE_DARK_TIME: process.env.NEXT_PUBLIC_APPEARANCE_DARK_TIME || [18, 6], // 다크 모드 시작 및 종료 시간, false 설정 시 시간에 따른 자동 다크 모드 전환이 비활성화됩니다.

  AUTHOR: process.env.NEXT_PUBLIC_AUTHOR || 'NotionNext', // 닉네임 예: tangly1024
  BIO: process.env.NEXT_PUBLIC_BIO || '평범하게 하루하루 열일하는 직장인 📝', // 작성자 소개
  LINK: process.env.NEXT_PUBLIC_LINK || 'https://tangly1024.com', // 웹사이트 주소
  KEYWORDS: process.env.NEXT_PUBLIC_KEYWORD || 'Notion, 노션, 도움말, 블로그', // 웹사이트 키워드 (영문 쉼표로 구분)
  BLOG_FAVICON: process.env.NEXT_PUBLIC_FAVICON || '/favicon.ico', // 블로그 파비콘(favicon) 설정, 기본값은 /public/favicon.ico 사용, 온라인 이미지 주소 지원 (예: https://img.imesong.com/favicon.png)
  BEI_AN: process.env.NEXT_PUBLIC_BEI_AN || '', // 중국 ICP 비안 번호 (한국 유저는 비워두면 됩니다)
  BEI_AN_LINK: process.env.NEXT_PUBLIC_BEI_AN_LINK || '', // 비안 조회 링크 (한국 유저는 무시 가능)
  BEI_AN_GONGAN: process.env.NEXT_PUBLIC_BEI_AN_GONGAN || '', // 중국 공안 비안 번호 (한국 유저는 무시 가능)

  // RSS 구독
  ENABLE_RSS: process.env.NEXT_PUBLIC_ENABLE_RSS || true, // RSS 구독 기능 활성화 여부

  // 기타 복잡한 설정
  // 원래 설정 파일이 너무 길고 모든 사람이 사용하지는 않으므로 설정을 /conf/ 디렉토리로 분할했습니다. 필요에 따라 해당 파일을 찾아 수정하면 됩니다.
  ...require('./conf/comment.config'), // 댓글 플러그인
  ...require('./conf/contact.config'), // 작성자 연락처 설정
  ...require('./conf/post.config'), // 글 및 목록 설정
  ...require('./conf/analytics.config'), // 사이트 방문 통계
  ...require('./conf/image.config'), // 웹사이트 이미지 관련 설정
  ...require('./conf/font.config'), // 웹사이트 글꼴
  ...require('./conf/right-click-menu'), // 사용자 정의 우클릭 메뉴 관련 설정
  ...require('./conf/code.config'), // 웹사이트 코드 블록 스타일
  ...require('./conf/animation.config'), // 애니메이션 및 미화 효과
  ...require('./conf/widget.config'), // 웹페이지에 플로팅되는 위젯 (채팅 상담, 펫 위젯, 음악 플레이어 등)
  ...require('./conf/ad.config'), // 광고 수익화 플러그인
  ...require('./conf/plugin.config'), // 기타 제3자 플러그인 (Algolia 전체 텍스트 인덱스 등)
  ...require('./conf/ai.config'), // / AI 관련 설정 (AI 요약, AI 챗봇 등)
  ...require('./conf/performance.config'), // 성능 최적화 설정
  ...require('./conf/top-tag.config'), // 상단 고정 글 전역 설정

  // 고급 기능
  ...require('./conf/layout-map.config'), // 라우트 및 레이아웃 매핑 사용자 정의 (예: 특정 라우트의 페이지 레이아웃 커스텀)
  ...require('./conf/notion.config'), // 노션 데이터베이스 읽기 관련 확장 설정 (예: 사용자 정의 테이블 헤더)
  ...require('./conf/dev.config'), // // 개발 및 디버깅 시 참고해야 할 설정

  // 사용자 정의 외부 스크립트 및 외부 스타일
  CUSTOM_EXTERNAL_JS: [''], // 예: ['http://xx.com/script.js','http://xx.com/script.js']
  CUSTOM_EXTERNAL_CSS: [''], // 예: ['http://xx.com/style.css','http://xx.com/style.css']

  // 사용자 정의 메뉴
  CUSTOM_MENU: process.env.NEXT_PUBLIC_CUSTOM_MENU || true, // Menu 타입의 메뉴 지원 (3.12 버전 이전의 Page 타입을 대체)

  // 글 목록 관련 설정
  CAN_COPY: process.env.NEXT_PUBLIC_CAN_COPY || true, // 페이지 내용 복사 허용 여부. 기본값은 허용(true)이며, false로 설정 시 사이트 전체에서 내용 복사가 금지됩니다.

  ...require('./conf/techgrow.config'), // 위챗 공식계정 연동 플러그인 (TechGrow)

  // 사이드바 레이아웃 반전 여부 (좌우 반전). 지원되는 테마: hexo, next, medium, fukasawa, example
  LAYOUT_SIDEBAR_REVERSE:
    process.env.NEXT_PUBLIC_LAYOUT_SIDEBAR_REVERSE || false,

  // 환영 문구 타이핑 효과. Hexo 및 Matery 테마 지원. 영문 쉼표로 여러 문구를 구분합니다.
  GREETING_WORDS:
    process.env.NEXT_PUBLIC_GREETING_WORDS ||
    '안녕하세요, 반갑습니다! 🌟, 노션으로 만든 나만의 도움말 센터입니다., 환영합니다! 🎉',

  // 환영 문구 타이핑 속도
  GREETING_WORDS_TYPE_SPEED:
    process.env.NEXT_PUBLIC_GREETING_WORDS_TYPE_SPEED || 200,

  // 환영 문구 백스페이스(지우기) 속도
  GREETING_WORDS_BACK_SPEED:
    process.env.NEXT_PUBLIC_GREETING_WORDS_BACK_SPEED || 100,

  // UUID를 Slug로 리다이렉트 여부
  UUID_REDIRECT: process.env.UUID_REDIRECT || false
}

module.exports = BLOG
