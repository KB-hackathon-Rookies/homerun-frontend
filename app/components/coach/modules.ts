/**
 * 코치 교육 모듈.
 *
 * 루마다 필요한 순간에 코치가 알려주는 내용을 미리 보는 곳이다. 시안(메인 6~10)
 * 기준으로 13개를 루별로 묶었다.
 *
 * **본문이 실제로 쓰인 건 둘뿐이다** — 안심계약 3·3·3 법칙과 전세사기 유형
 * 5가지. 나머지는 제목·소요시간만 시안에 있어서 `body` 를 비워 두고 화면에서
 * "준비 중" 으로 보여준다. 없는 내용을 지어내지 않는다.
 */
import type { EducationCode } from '~/api/education';

export type ModuleBase = '1루 시작' | '2루 · 매물 검증' | '3루 · 계약과 실행' | '홈 · 정착';

export const MODULE_BASES: ModuleBase[] = [
  '1루 시작',
  '2루 · 매물 검증',
  '3루 · 계약과 실행',
  '홈 · 정착',
];

/** 학습 본문 한 조각. 모듈마다 순서대로 쌓인다. */
export type ContentBlock =
  | { kind: 'coach'; text: string }
  | { kind: 'steps'; heading: string; items: string[] }
  | { kind: 'cases'; items: { title: string; body: string }[] }
  | { kind: 'note'; heading: string; items: string[] };

export interface QuizQuestion {
  statement: string;
  answer: 'O' | 'X';
  explanation: string;
}

export interface CoachModule {
  id: string;
  /**
   * 짝이 되는 백엔드 모듈 code. 짝이 없으면 null 이다.
   *
   * 순서로 계산하지 않고 모듈마다 직접 적는다. 순서로 만들면 목록에 하나만 끼워 넣어도
   * 그 뒤 모듈이 전부 남의 본문을 끌어오고, 진행률도 엉뚱한 모듈에 기록된다.
   * 선택 항목이 아니라 필수라서, 모듈을 새로 추가하면 짝을 정할 때까지 타입체크가 막는다.
   */
  code: EducationCode | null;
  base: ModuleBase;
  title: string;
  minutes: number;
  /** 대시보드 카드에 세우는 모듈만 채운다. */
  featured?: string;
  /**
   * 대시보드 카드 색. 시안(메인 1)이 세 장에 각각 다른 색을 줬다.
   * 순서로 정하면 목록이 바뀔 때 색이 따라 움직이므로 모듈에 붙여 둔다.
   */
  tone?: 'contract' | 'fraud' | 'change';
  /** 없으면 준비 중. */
  body?: ContentBlock[];
  /** 있는 문제만 담는다. 시안이 "1/3" 이라도 쓰인 문제가 하나면 하나만 낸다. */
  quiz?: QuizQuestion[];
}

export const COACH_MODULES: CoachModule[] = [
  {
    id: 'safe-contract-333',
    code: 'M0',
    base: '1루 시작',
    title: '안심계약 3·3·3 법칙',
    minutes: 3,
    featured: '계약 전·시·후 9가지',
    tone: 'contract',
    body: [
      {
        kind: 'coach',
        text: '전세 계약 전체를 관통하는 뼈대부터 알려줄게. 국토교통부가 경찰청, 한국공인중개사협회와 함께 만든 안심계약 3·3·3 법칙이야. 계약 전, 계약 시, 계약 후에 각각 3가지씩 총 9가지만 챙기면 대부분의 피해를 막을 수 있어',
      },
      {
        kind: 'steps',
        heading: '계약 전 3가지',
        items: [
          '충분한 주변 시세 조사',
          '등기사항전부증명서로 임차할 주택의 권리관계 확인',
          '전세보증보험 가입이 가능한 집인지 보증사에 문의',
        ],
      },
      {
        kind: 'steps',
        heading: '계약 시 3가지',
        items: [
          '공인중개사의 정상 영업 여부 확인',
          '계약 상대방과 임대인 일치 여부 확인',
          '주택임대차 표준계약서 또는 한국공인중개사협회 계약서 사용',
        ],
      },
      {
        kind: 'steps',
        heading: '계약 후 3가지',
        items: [
          '즉시 임대차계약 신고 또는 확정일자 받기',
          '잔금 지급 전에 등기부를 다시 확인해 권리관계 변동 살피기',
          '이사 당일 전입신고 완료',
        ],
      },
      {
        kind: 'note',
        heading: '🍯 체크리스트는 실물로도 받을 수 있어',
        items: [
          '주민센터, 은행, 중개사무소에서 교부',
          '직방, 다방, 한방, 네이버부동산 메인화면에서도 확인',
          '종합안내서는 HUG 홈페이지에서 무료 다운로드',
        ],
      },
    ],
    quiz: [
      {
        statement: '확정일자는 이사하고 나서 천천히 받아도 늦지 않다',
        answer: 'X',
        explanation:
          '계약 후 즉시 임대차 신고 또는 확정일자를 받아야 해. 대출 신청 서류에도 필요하고, 이사 당일은 정신없어서 잊기 쉬워',
      },
      {
        statement: '잔금을 치르기 전에 등기부를 한 번 더 확인해야 한다',
        answer: 'O',
        explanation:
          '계약할 때 깨끗했어도 잔금 전에 근저당이 새로 잡힐 수 있어. 계약 후 3가지에 이게 들어 있는 이유야',
      },
      {
        statement: '계약하러 나온 사람이 등기부상 소유자와 달라도 중개사가 확인했으면 괜찮다',
        answer: 'X',
        explanation:
          '계약 상대방과 임대인이 같은 사람인지 신분증으로 직접 대조해야 해. 대리인이면 위임장까지 확인하고',
      },
    ],
  },
  {
    id: 'contract-check-8',
    code: 'M1',
    base: '2루 · 매물 검증',
    title: '계약 전에 확인할 8가지',
    minutes: 4,
  },
  {
    id: 'fraud-types-5',
    code: 'M2',
    base: '2루 · 매물 검증',
    title: '전세사기 유형 5가지',
    minutes: 4,
    featured: '깡통·갭투자·신탁 막는 법',
    tone: 'fraud',
    body: [
      {
        kind: 'coach',
        text: '피해자들이 공통적으로 하는 말이 있어. "중개사가 안전한 집이라고 했다", "등기부등본을 떼어 봤는데도 속았다". 수법을 알아야 방어할 수 있어. 대표적인 유형 다섯 가지를 알려줄게',
      },
      {
        kind: 'cases',
        items: [
          {
            title: '① 깡통전세',
            body: '집값보다 전세금이 높거나 비슷한 상태. 막는 법: 전세가율 계산, 시세 조사, 반환보증 가입',
          },
          {
            title: '② 무자본 갭투자',
            body: '보증금만으로 집을 사 모으는 방식. 막는 법: 임대인 정보 조회로 보유 주택 수와 취득일 확인',
          },
          {
            title: '③ 이중계약',
            body: '한 집으로 여러 세입자와 계약. 막는 법: 중개사 자격 확인, 전입세대확인서, 계약 당일 등기부 재확인',
          },
          {
            title: '④ 신탁사기',
            body: '소유권은 신탁회사에 있는데 집주인 행세. 막는 법: 갑구 신탁등기 확인, 있으면 신탁원부까지',
          },
          {
            title: '⑤ 고의 미반환',
            body: '처음부터 안 돌려줄 생각. 막는 법: 반환보증 가입이 사실상 유일한 방어책',
          },
        ],
      },
      {
        kind: 'note',
        heading: '⚠️ 요즘은 유형이 결합돼',
        items: [
          '신탁, 법인, 무자본 갭투자, 이중계약이 섞여서 진화 중',
          '확정일자까지 받고도 보증금을 못 돌려받는 사례가 나오는 이유',
          '빌라뿐 아니라 아파트, 오피스텔, 신축까지 번지는 중',
        ],
      },
    ],
    quiz: [
      {
        statement: '전세가율이 높아도 확정일자만 받아두면 보증금은 안전하다',
        answer: 'X',
        explanation:
          '확정일자는 순위를 잡아줄 뿐이야. 집값보다 전세금이 높으면(깡통전세) 경매로 넘어가도 받을 돈 자체가 모자라. 반환보증까지 들어야 해',
      },
      {
        statement: '등기부 갑구에 신탁등기가 있으면 신탁원부까지 확인해야 한다',
        answer: 'O',
        explanation:
          '소유권이 신탁회사에 있는데 집주인 행세를 하는 게 신탁사기야. 갑구에 신탁이 보이면 신탁원부에서 누가 임대 권한을 갖는지 확인해',
      },
      {
        statement: '전세사기는 빌라에서만 일어난다',
        answer: 'X',
        explanation:
          '아파트, 오피스텔, 신축까지 번지는 중이야. 유형도 신탁·법인·갭투자·이중계약이 섞여서 진화하고 있어',
      },
    ],
  },
  {
    id: 'building-ledger',
    code: 'M3',
    base: '2루 · 매물 검증',
    title: '건축물대장 보는 법',
    minutes: 3,
  },
  {
    id: 'registry-reading',
    code: 'M4',
    base: '2루 · 매물 검증',
    title: '등기부등본 보는 법',
    minutes: 5,
  },
  { id: 'empty-jeonse', code: 'M5', base: '2루 · 매물 검증', title: '깡통전세란', minutes: 2 },
  {
    id: 'verify-landlord',
    code: 'M6',
    base: '2루 · 매물 검증',
    title: '임대인 확인하기',
    minutes: 3,
  },
  {
    id: 'visit-checklist',
    code: 'M7',
    base: '3루 · 계약과 실행',
    title: '임장 체크리스트',
    minutes: 4,
  },
  {
    id: 'contract-terms',
    code: 'M8',
    base: '3루 · 계약과 실행',
    title: '계약서와 특약',
    minutes: 5,
  },
  {
    id: 'fixed-date',
    code: 'M9',
    base: '3루 · 계약과 실행',
    title: '대항력과 확정일자',
    minutes: 4,
  },
  { id: 'move-in-check', code: 'M10', base: '홈 · 정착', title: '입주 사전점검', minutes: 2 },
  { id: 'when-trouble', code: 'M11', base: '홈 · 정착', title: '사고가 났다면', minutes: 2 },
  {
    id: 'changes-2026',
    // 백엔드 V71 시드(M0~M12)에 '2026년 달라진 것' 에 해당하는 콘텐츠가 없다.
    // 순서로 코드를 만들던 시절엔 이 자리가 M12 '도움받을 곳' 을 끌어와, 제목은 여기 것이고
    // 본문은 남의 것인 화면이 됐다. 짝이 없으면 없다고 적는다 — 억지로 갖다 붙이지 않는다.
    code: null,
    base: '홈 · 정착',
    title: '2026년 달라진 것',
    minutes: 3,
    featured: '세입자 보호 강화 6가지',
    tone: 'change',
  },
];

/** 대시보드 캐러셀에 세우는 모듈. 시안이 세 장을 보여준다. */
export const FEATURED_MODULES = COACH_MODULES.filter((module) => module.featured);
