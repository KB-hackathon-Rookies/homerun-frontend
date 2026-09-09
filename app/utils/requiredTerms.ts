/**
 * 필수 약관 미동의로 막힌 상태를 앱 전체가 같은 이름으로 부르기 위한 것.
 *
 * 백엔드 `RequiredTermsAgreementFilter` 는 동의 기록이 없으면 **모든 요청**에
 * 403 `TERMS_005` 를 낸다. 로그인만 되고 그 다음이 통째로 죽는다. 이걸 알아보는
 * 쪽이 인터셉터·홈 둘이라, 코드 문자열과 화면 경로를 여기 한 번만 적는다.
 */

/** `ErrorCode.REQUIRED_TERMS_AGREEMENT_REQUIRED`. 403 중에 이것만 약관 문제다. */
export const REQUIRED_TERMS_CODE = 'TERMS_005';

/**
 * 동의를 받는 화면.
 *
 * 이 화면이 부르는 것은 `/terms` · `/agreements/me` · `/agreements` 셋뿐이고
 * 셋 다 필터의 `shouldNotFilter` 예외라 여기서 다시 `TERMS_005` 가 날 수 없다.
 * 되돌이표가 생기지 않는 근거가 이것이다.
 */
export const REQUIRED_TERMS_PATH = '/terms/required';
