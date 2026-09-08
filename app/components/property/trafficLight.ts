import type { TrafficLight } from '~/api/property';
import type { BadgeTone } from '~/components/result/badge';

/**
 * 신호등을 뱃지 톤으로 옮긴다.
 *
 * 글자는 백엔드가 준 `trafficLightLabel` 을 그대로 쓴다. 화면에서 다시 지어내면
 * 판정 뜻과 어긋난다 — YELLOW 는 "확인 필요" 지 "주의" 가 아니다.
 */
const TONE: Record<TrafficLight, BadgeTone> = {
  RED: 'negative',
  YELLOW: 'cautionary',
  GREEN: 'positive',
  BLUE: 'informative',
};

export function trafficTone(light: TrafficLight | null): BadgeTone {
  return light ? TONE[light] : 'cautionary';
}

/**
 * 은행 상담 결과를 받아도 되는 상태인가.
 *
 * 백엔드 `TrafficLight.showsLoanProducts()` 와 같은 조건이다 — 상담 저장은
 * GREEN·BLUE 에서만 받고 아니면 409(PRP_012)로 막는다. 화면이 이걸 모르면
 * 사용자가 **은행을 다 돌고 와서 결과를 적는 순간**에야 막힌다. 헛걸음을
 * 시키지 않으려면 들여보내기 전에 여기서 거른다.
 *
 * 신호등을 아직 못 읽었으면(`null`) 통과시키지 않는다. 모르는 상태를 열어 두면
 * 막으려던 그 헛걸음이 그대로 난다.
 */
export function acceptsConsultation(light: TrafficLight | null): boolean {
  return light === 'GREEN' || light === 'BLUE';
}
