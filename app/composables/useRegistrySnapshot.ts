import type { RegistryFacts } from '~/api/contract';

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

  const onlyDigits = (value: string) => Number(value.replace(/\D/g, '') || 0);

  /** 위험 항목은 없음/있음/모름 셋 중 하나다. 모름은 null 이다. */
  const presence = (value: string | null) => (value === 'UNKNOWN' || value === null ? null : value === 'FOUND');

  /** 다섯 항목을 모두 골라야 대조를 요청할 수 있다. 금액은 모르면 비워 둔다(null). */
  const answered = computed(
    () =>
      !!owner.value && !!seizure.value && !!leasehold.value && !!auction.value && !!trust.value,
  );

  const facts = computed<RegistryFacts>(() => ({
    ownerMatchesContractParty:
      owner.value === 'UNKNOWN' || owner.value === null ? null : owner.value === 'SAME',
    seizureOrDispositionRestricted: presence(seizure.value),
    leaseholdRegistered: presence(leasehold.value),
    auctionInProgress: presence(auction.value),
    trustRegistered: presence(trust.value),
    seniorDebt: seniorDebt.value.trim() ? onlyDigits(seniorDebt.value) * 10_000 : null,
    mortgageCount: mortgageCount.value.trim() ? onlyDigits(mortgageCount.value) : null,
  }));

  return { owner, seizure, leasehold, auction, trust, seniorDebt, mortgageCount, answered, facts };
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
