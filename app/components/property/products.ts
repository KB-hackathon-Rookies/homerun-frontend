/**
 * 상품 설명 표.
 *
 * 금리 · 한도 · 기간 · 상환 · 우대금리 · 취급은행 · 보증기관 — 이 값들을
 * 주는 엔드포인트가 없다. 판정 API 는 "되는가 · 얼마인가" 만 주고 "어떤
 * 상품인가" 는 안 준다.
 *
 * 그래서 시안의 문구를 여기 한곳에 모아 뒀다. **정책은 해마다 바뀌므로 이 표는
 * 언젠가 틀려진다.** 화면 여기저기에 흩어 두면 어디를 고쳐야 할지 못 찾으니
 * 이 파일 하나만 보면 되게 했고, 백엔드에 상품 상세 API 가 생기면 통째로
 * 지우고 갈아 끼운다.
 *
 * 화면에 나오는 **금액·금리는 여기가 아니라 판정 결과에서** 온다. 여기 있는
 * 건 상품 자체의 규격이지 이 사람의 계산 결과가 아니다.
 */
export interface ProductDoc {
  /** 상단 바 제목. 정책 이름이 길면 줄여 쓴다. */
  title: string;
  summary: string;
  specs: { label: string; value: string; highlight?: boolean }[];
  /** 우대금리 — 청년 버팀목만 있다. */
  preferential?: { title: string; lines: string[] };
  /** 다른 상품과의 대비 — 일반 버팀목이 청년과 견준다. */
  compare?: { columns: [string, string]; rows: [string, string, string][] };
  /** 금리를 어떻게 만들었는가 — 서울시 이자지원처럼 여러 항목을 더하고 빼는 상품. */
  rateCalc?: { lines: string[]; result: string; note: string };
  /** 보증기관(담보 방식) — 은행 상담 상품만. */
  guarantees?: { name: string; desc: string }[];
  tip?: string;
  warn?: string;
  banks?: string;
}

const BEOTIMMOK_BANKS = '국민 · 신한 · 하나 · 우리 · 농협 · 기업 (조건·금리 동일)';

export const PRODUCTS: Record<string, ProductDoc> = {
  'JEONSE-YOUTH-BEOTIMMOK': {
    title: '청년 버팀목 대출',
    summary:
      '청년 버팀목 전세자금대출은 만 19~34세(병역보정 39세) 무주택 청년의 전세보증금 마련을 위한 국토부 기금 상품이에요.',
    specs: [
      { label: '금리', value: '연 2.2~3.3% (우대 적용 후)' },
      { label: '한도', value: '보증금의 80%, 최대 1.5억원' },
      { label: '기간', value: '2년, 4회 연장 최장 10년' },
      { label: '상환', value: '만기일시상환 (매달 이자만)' },
      { label: '중도상환', value: '없음' },
    ],
    preferential: {
      title: '우대금리 (합산 상한 0.5%p)',
      lines: [
        '· 중소, 중견기업 재직 청년 0.3%p',
        '· 만 25세 미만 단독세대주 0.3%p',
        '· 부동산 전자계약 0.1%p',
      ],
    },
    banks: BEOTIMMOK_BANKS,
  },

  'JEONSE-GENERAL-BEOTIMMOK': {
    title: '일반 버팀목',
    summary:
      '일반 버팀목 전세자금대출은 나이 제한 없이 모든 무주택 세대주가 이용할 수 있는 국토부 기금 상품이에요. 청년 버팀목이 안 될 때 대안이 돼요.',
    specs: [
      { label: '금리', value: '연 2.9% 수준 (변동)' },
      { label: '한도', value: '수도권 1.2억원 / 수도권 외 8천만원' },
      { label: '보증금 상한', value: '수도권 3억 / 수도권 외 2억' },
      { label: '나이', value: '제한 없음' },
      { label: '상환', value: '만기일시상환' },
    ],
    compare: {
      columns: ['청년', '일반'],
      rows: [
        ['나이', '만 19~34세 (병역 39세)', '제한 없음'],
        ['수도권 한도', '1.5억', '1.2억'],
        ['금리', '연 2.2~3.3%', '연 2.9%'],
        ['중소기업 우대', '0.3%p 있음', '없음'],
      ],
    },
    banks: BEOTIMMOK_BANKS,
  },

  'JEONSE-SEOUL-INTEREST-SUPPORT': {
    title: '서울시 청년 임차보증금 이자지원',
    summary:
      '서울시-하나은행 협약 상품이에요. 서울시가 대출 이자 일부를 지원해서 실제 부담 금리가 낮아져요.',
    specs: [
      { label: '금리', value: '연 2.10% (변동)', highlight: true },
      { label: '한도', value: '보증금의 90%, 최대 2억원' },
      { label: '기간', value: '6개월~2년 · 최대 8년' },
      { label: '취급은행', value: '하나은행 전용' },
      { label: '대상 나이', value: '만 19~39세' },
      { label: '상환', value: '만기일시상환' },
    ],
    rateCalc: {
      lines: ['기준금리 (COFIX 6M) 2.65%', '+ 가산금리 1.45% − 이자지원 2.0%'],
      result: '= 실효 금리 연 2.10%',
      note: '※ 2026.8.18 공시 COFIX 기준 · 변동',
    },
    warn: '⚠️ 3루 이후는 이 앱에서 안내하지 않아요',
  },

  'GENERAL-JEONSE-LOAN': {
    title: '은행 전세대출',
    summary:
      '은행 자체 전세자금대출. 정책 조건이 없어서 항상 매칭되지만, 한도·금리는 담보 방식과 개인 조건에 따라 크게 달라져요. 사전상담이 꼭 필요해요.',
    specs: [
      { label: '금리', value: '연 2.5~4% (상담 후 확정)' },
      { label: '한도', value: '담보 방식에 따라 다름' },
      { label: '나이·소득', value: '제한 없음' },
      { label: '보증금', value: '상품별 상이' },
    ],
    guarantees: [
      { name: '주신보 (HF)', desc: '증빙소득 × 3.5배까지 · 보증료 저렴 · 반환보증은 별도' },
      { name: '안심전세 (HUG)', desc: '집의 가치 기준 · 반환보증 포함 · 조건 까다로움' },
      { name: '서신보 (SGI)', desc: '한도 최대 · 소득·자산 기준 없음 · 보증료 비쌈' },
    ],
    tip: '💡 은행 방문 시 "어느 보증서로 진행되나요?" 꼭 물어보세요',
  },
};
