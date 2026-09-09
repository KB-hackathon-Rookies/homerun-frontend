/**
 * 홈 코치 TIME.
 *
 * 시안 홈 페이지의 코치 모달 10종. 시트 형태는 1·2·3루와 같이
 * `~/components/coach/sheet` 를 쓴다.
 *
 * ⚠️ 실제 문구는 시안 노드(홈 코치 TIME 모달)에서 pull 해서 채워야 한다.
 */
import type { CoachSheet } from '~/components/coach/sheet';

const TODO = '📝 시안 문구는 홈 코치 TIME 노드에서 pull 해서 채워야 한다.';

export const COACH_TIME = {
  /** 홈 정착 대시보드 */
  settlementHome: {
    title: '정착 관리, 같이 챙겨볼게',
    intro:
      '입주 뒤에도 대출·보증금·생활비는 계속 확인해야 해요. 지금 해야 할 일부터 하나씩 끝내면 돼요.',
    qa: [
      {
        q: '무엇부터 보면 되나요?',
        a: '화면 맨 위의 ‘지금 해야 할 일’을 먼저 확인하세요. 마감이 가까운 일부터 정리해드려요.',
      },
      {
        q: '매달 챙길 건 무엇인가요?',
        a: '실행 대출과 고정지출을 등록하면 월 이자와 주거비를 계속 살펴볼 수 있어요.',
      },
    ],
    related: [{ id: 'safe-contract-333', label: '안심계약 3·3·3 법칙' }],
  },
  /** 홈 2 · 반환보증 가입 (`687:9717`) */
  returnGuarantee: { title: '반환보증 가입', intro: TODO, qa: [] },
  /** 홈 3 · 보증료 지원 신청 (`687:9819`) */
  feeSupport: { title: '보증료 지원 신청', intro: TODO, qa: [] },
  /** 홈 4 · 사후자산심사 (`687:9922`) */
  assetReview: { title: '사후자산심사', intro: TODO, qa: [] },
  /** 홈 5 · 중개보수·이사비 지원 (`687:10018`) */
  movingSupport: { title: '중개보수·이사비 지원', intro: TODO, qa: [] },
  /** 홈 9 · 이번 달 상태 (`687:10115`) */
  monthlyCheckin: { title: '이번 달 상태', intro: TODO, qa: [] },
  /** 홈 10 · 금리인하요구권 (`687:10195`) */
  rateCut: { title: '금리인하요구권', intro: TODO, qa: [] },
  /** 홈 11 · 연말정산 소득공제 (`687:10279`) */
  taxDeduction: { title: '연말정산 소득공제', intro: TODO, qa: [] },
  /** 홈 12 · 갱신 판정 (`687:10356`) */
  renewalCheck: { title: '갱신 판정', intro: TODO, qa: [] },
  /** 홈 13 · 퇴거 준비 (`687:10442`) */
  moveOut: { title: '퇴거 준비', intro: TODO, qa: [] },
  /** 홈 14 · 사고가 났다면 (`687:9599`) */
  troubleResponse: { title: '사고가 났다면', intro: TODO, qa: [] },
} satisfies Record<string, CoachSheet>;
