import type { RegistryFacts } from '~/api/contract';
import { parseCount, parseManwon } from '~/utils/amount';

/**
 * 등기부 스냅샷 입력을 모아 서버가 받는 사실값으로 바꾼다.
 *
 * 계약 때(CONTRACT_SIGNING)와 잔금일(SETTLEMENT_DAY)이 같은 일곱 사실을 남긴다.
 * **모름은 `null` 로 보낸다** — 안 본 것을 `false`/`true` 로 채우면 서버 대조가
 * 잘못 통과하거나 없는 위험을 만든다.
 */
export function useRegistrySnapshot() {
  const owner = ref<string | null>(null);
  const seizure = ref<string | null>(null);
  const leasehold = ref<string | null>(null);
  const auction = ref<string | null>(null);
  const trust = ref<string | null>(null);
  const seniorDebt = ref('');
  const mortgageCount = ref('');

  /**
   * 검사한 뒤에 단위를 바꾼다.
   *
   * 전에는 숫자가 아닌 글자를 지워서 값을 만들었다. `abc` 가 0원이 되고 근저당 `1.5` 가
   * 15건이 됐다 — 못 적은 값과 확인해서 없는 값이 같아진다. 등기부는 잔금 대조의
   * 근거라서 이 차이가 그대로 판정 오류가 된다.
   */
  const parsedSeniorDebt = computed(() => parseManwon(seniorDebt.value));
  const parsedMortgageCount = computed(() => parseCount(mortgageCount.value));

  /** 위험 항목은 없음/있음/모름 셋 중 하나다. 모름은 null 이다. */
  const presence = (value: string | null) =>
    value === 'UNKNOWN' || value === null ? null : value === 'FOUND';

  /**
   * 일곱 항목을 다 채워야 대조를 요청할 수 있다.
   *
   * 서버는 채권최고액·근저당 건수가 계약 때와 잔금일 **양쪽 모두 있어야** SAFE 를 낸다
   * (`RegistryComparisonService` 의 unknown 판정). 비워서 `null` 로 보내면 대조가 계속
   * NEED_INFO 에 머물러 3루 완료가 영영 막힌다. 없으면 0 을 받는다 — 안 본 것을 채우는
   * 게 아니라, 확인해서 없더라는 사실을 적는 것이다.
   */
  const answered = computed(
    () =>
      !!owner.value &&
      !!seizure.value &&
      !!leasehold.value &&
      !!auction.value &&
      !!trust.value &&
      parsedSeniorDebt.value.value !== null &&
      parsedMortgageCount.value.value !== null,
  );

  const facts = computed<RegistryFacts>(() => ({
    ownerMatchesContractParty:
      owner.value === 'UNKNOWN' || owner.value === null ? null : owner.value === 'SAME',
    seizureOrDispositionRestricted: presence(seizure.value),
    leaseholdRegistered: presence(leasehold.value),
    auctionInProgress: presence(auction.value),
    trustRegistered: presence(trust.value),
    seniorDebt: parsedSeniorDebt.value.value,
    mortgageCount: parsedMortgageCount.value.value,
  }));

  return {
    owner,
    seizure,
    leasehold,
    auction,
    trust,
    seniorDebt,
    mortgageCount,
    /** 칸에 그대로 붙이는 오류 문구. 비어 있으면 오류가 아니다. */
    seniorDebtError: computed(() => parsedSeniorDebt.value.error ?? ''),
    mortgageCountError: computed(() => parsedMortgageCount.value.error ?? ''),
    answered,
    facts,
  };
}

/** 소유자 대조 선택지. */
export const OWNER_OPTIONS = [
  { value: 'SAME', label: '같아요' },
  { value: 'DIFFERENT', label: '달라요' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

/** 계약 때 위험 존재 여부 선택지(있나요). */
export const PRESENCE_NOW_OPTIONS = [
  { value: 'NONE', label: '없어요' },
  { value: 'FOUND', label: '있어요' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

/** 잔금일 위험 신규 발생 선택지(새로 생겼나요). */
export const PRESENCE_NEW_OPTIONS = [
  { value: 'NONE', label: '없어요' },
  { value: 'FOUND', label: '생겼어요' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];
