import { useAgreementApi } from '~/api/terms-status';

/**
 * 사용자가 화면에서 직접 고른 약관 동의.
 *
 * 코드가 대신 채우지 않는다. 필수는 사용자가 다 체크했을 때만 `requiredAgreed`
 * 가 참이고, 선택은 사용자가 실제로 체크한 값이다.
 */
export interface TermsConsent {
  /** 필수 약관을 사용자가 모두 직접 동의했는가. */
  requiredAgreed: boolean;
  /** 선택 약관에 사용자가 동의했는가. */
  optionalAgreed: boolean;
}

/**
 * 사용자가 고른 약관 동의를 서버에 남긴다.
 *
 * 백엔드에 `RequiredTermsAgreementFilter` 가 있어서, 동의 기록이 없으면 이후
 * 요청이 **전부 403** 이 된다. 로그인은 되는데 그 다음이 통째로 막힌다.
 *
 * 약관 목록은 인증이 필요해 가입 전에 부를 수 없다. 그래서 화면에서 사용자가
 * 직접 동의한 값을 받아 두고, 토큰이 생긴 직후에 여기서 남긴다.
 *
 * 무엇에 동의했는지는 **서버 목록이 기준이다.** 화면이 들고 있는 줄과 서버의
 * 줄은 개수가 다르고 개정되면 또 달라진다. 그래서 서버 목록을 기준으로,
 * 각 줄이 필수인지 선택인지에 따라 사용자가 실제로 고른 값을 그대로 남긴다.
 * 예전처럼 코드가 전부 참으로 채우지 않는다.
 */
export function useRequiredTerms() {
  const api = useAgreementApi();

  /**
   * 아직 동의가 남지 않았으면, 사용자가 고른 값으로 남긴다.
   *
   * 필수에 동의하지 않았으면 애초에 남길 수 없다 — 던진다. 여기서 실패해도
   * 가입 자체를 되돌리지는 않는다(계정은 이미 만들어졌다). 대신 조용히
   * 넘어가지 않고 알린다.
   */
  async function ensure(consent: TermsConsent) {
    if (!consent.requiredAgreed) {
      throw new Error('필수 약관에 동의해야 가입을 완료할 수 있어요.');
    }

    const status = await api.mine();
    if (status.allRequiredAgreed) return true;

    const terms = await api.list();
    const items = terms.map((term) => ({
      code: term.code,
      version: term.version,
      agreed: term.required ? consent.requiredAgreed : consent.optionalAgreed,
    }));

    if (!items.length) return true;

    await api.agree(items);
    return true;
  }

  return { ensure };
}
