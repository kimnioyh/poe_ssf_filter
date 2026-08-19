// Shown in the in-app changelog modal. Newest first.
export const CHANGELOG: { version: string; ko: string; en: string }[] = [
  {
    version: 'v0.20.0',
    ko: '미보유 유니크 드랍 알림 강화 토글 — 강제 표시 블록에 미니맵 아이콘·알림 사운드·드랍 빔 추가.',
    en: 'Loud-alert toggle for still-needed unique drops — minimap icon, alert sound and drop beam on the force-show block.',
  },
  {
    version: 'v0.19.1',
    ko: '숨김 선택한 화폐·점술카드 이름에 취소선 표시(숨김 인지 개선).',
    en: 'Strikethrough on selected currencies/cards for clearer hidden state.',
  },
  {
    version: 'v0.19.0',
    ko: '점술카드 등급별 접이식 그룹, 보상에 인플루언스/변형 표시(쉐이퍼 방패 등), 비활성 카드 제외.',
    en: 'Divination cards grouped by rarity (collapsible); reward shows influence/variant; disabled cards dropped.',
  },
  {
    version: 'v0.18.0',
    ko: '점술카드 보상·스택·등급 표시(카드 그리드), 등급색 힌트, 카드 클릭으로 숨김 토글.',
    en: 'Divination card rewards/stack/rarity grid; rarity-color hint; click to toggle hide.',
  },
  {
    version: 'v0.17.0',
    ko: '점술카드 숨기기 — 카드 검색(EN/KO 464종)해서 개별 숨김(Class "Divination Card").',
    en: 'Hide divination cards — search (464 EN/KO) to hide individually.',
  },
  {
    version: 'v0.16.0',
    ko: '설정 자동 저장(localStorage)·공유 링크, 수집 진행도·검색, 리그 제외, 최종 필터 줄 수 표시.',
    en: 'Settings persistence + share link, collection progress & search, league exclude, final-filter line count.',
  },
  {
    version: 'v0.15.0',
    ko: '고유템 검색 강조 추가 — 그 베이스의 고유템만 표시(노말/매직/레어 제외), 베이스 강조와 별도 블록.',
    en: 'Highlight-uniques-by-base search — shows only uniques on that base, separate from base highlight.',
  },
  {
    version: 'v0.14.0',
    ko: 'Vercel Web Analytics 방문 통계 연동.',
    en: 'Vercel Web Analytics for visitor stats.',
  },
  {
    version: 'v0.13.0',
    ko: '헤더에 건의하기 버튼(구글폼 링크) 추가.',
    en: 'Feedback button (Google Form link) in the header.',
  },
  {
    version: 'v0.12.0',
    ko: '화폐별 숨기기(스택 N개 이하/통으로)와 잡화폐 일괄 선택, 상단 업데이트 내역 버튼.',
    en: 'Per-currency hiding (StackSize ≤ N / all) with junk preset; in-app changelog button.',
  },
  {
    version: 'v0.11.0',
    ko: '필터/컬렉션 탭 분리, 컬렉션 모두/보유만 드롭다운(미보유 회색).',
    en: 'Filter/Collection tabs; owned/all dropdown (unowned grayed).',
  },
  {
    version: 'v0.10.0',
    ko: '베이스 강조 아이템 레벨 조건, T0~T2 베이스 항상 표시 토글.',
    en: 'Item-level bounds for base highlight; never-hide T0–T2 toggle.',
  },
  {
    version: 'v0.9.0',
    ko: '베이스 아이템 검색 강조 (노말/매직/레어, 타락 제외).',
    en: 'Search-and-highlight base items (Normal/Magic/Rare, non-corrupted).',
  },
  {
    version: 'v0.8.0',
    ko: '네버싱크가 숨기는 유니크만 강조 옵션.',
    en: 'Emphasize only uniques NeverSink hides.',
  },
  {
    version: 'v0.7.0',
    ko: '기본 한국어, 보유 유니크 카테고리별 카드 큐레이션.',
    en: 'Korean default; owned uniques as category card grid.',
  },
  {
    version: 'v0.6.0',
    ko: '기본 샘플 자동 로드+가이드 배너, 동명 유니크 변종 표시.',
    en: 'Auto-load sample + guide banner; same-name variant display.',
  },
  {
    version: 'v0.5.0',
    ko: '드릴다운에 유니크 아이콘·한글명.',
    en: 'Unique icons + KO names in drilldown.',
  },
  {
    version: 'v0.4.0',
    ko: '유니크 한글 이름·아이템 이미지 수집.',
    en: 'Scraped KO unique names + item images.',
  },
  {
    version: 'v0.3.0',
    ko: '베이스타입 한글 표시.',
    en: 'Korean base type names.',
  },
  {
    version: 'v0.2.0',
    ko: '재적용 멱등성, 미완료 베이스 드릴다운.',
    en: 'Idempotent re-apply; incomplete-base drilldown.',
  },
  {
    version: 'v0.1.0',
    ko: '초기 구현: CSV → 완료 베이스 → 네버싱크 필터 Show/Hide.',
    en: 'Initial: CSV → completed bases → NeverSink Show/Hide blocks.',
  },
]
