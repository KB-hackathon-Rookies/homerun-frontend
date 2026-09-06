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
