import { useAgreementApi } from '~/api/terms-status';

/**
 * 필수 약관 동의를 서버에 남긴다.
 *
 * 백엔드에 `RequiredTermsAgreementFilter` 가 있어서, 동의 기록이 없으면 이후
 * 요청이 **전부 403** 이 된다. 로그인은 되는데 그 다음이 통째로 막힌다.
 *
 * 약관 목록은 인증이 필요해 가입 전에 부를 수 없다. 그래서 화면에서 동의를
 * 받아 두고, 토큰이 생긴 직후에 여기서 남긴다.
 *
 * 무엇에 동의했는지는 **서버 목록이 기준이다.** 화면이 들고 있는 네 줄은
 * 서버의 두 줄과 다르고, 개정되면 또 달라진다. 사용자는 "필수 항목에 모두
 * 동의" 를 한 것이므로, 그때 서버가 필수라고 답한 것에 동의를 남긴다.
 */
export function useRequiredTerms() {
  const api = useAgreementApi();

  /**
   * 아직 동의가 남지 않았으면 남긴다.
   *
   * 여기서 실패해도 가입 자체를 되돌리지는 않는다 — 계정은 이미 만들어졌고,
   * 다음 로그인에서 다시 시도하면 된다. 대신 조용히 넘어가지 않고 알린다.
   */
  async function ensure() {
    const status = await api.mine();
    if (status.allRequiredAgreed) return true;

    const terms = await api.list();
    const required = terms
      .filter((term) => term.required)
      .map((term) => ({ code: term.code, version: term.version, agreed: true }));

    if (!required.length) return true;

    await api.agree(required);
    return true;
  }

  return { ensure };
}
