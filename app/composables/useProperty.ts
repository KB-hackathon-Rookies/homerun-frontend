import { usePropertyApi, type PropertyCandidate } from '~/api/property';
import { houseTypeLabel } from '~/utils/labels';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

const ALPHABET = 'ABCDEFGHIJ';

/**
 * 매물 하나를 목록에서 찾아 읽는다.
 *
 * 매물 단건 조회가 따로 없어 목록에서 고른다. 카드 이름("A매물")도 서버에
 * 없는 값이라 등록 순서로 매기는데, 그 순서 역시 목록에만 있다.
 */
export function useProperty(planId: number, propertyId: number) {
  const property = ref<PropertyCandidate | null>(null);
  const label = ref('');
  const error = ref('');

  onMounted(async () => {
    try {
      const list = await usePropertyApi().candidates(planId);
      const index = list.findIndex((item) => item.propertyId === propertyId);
      property.value = index === -1 ? null : list[index]!;
      label.value = index === -1 ? '' : `${ALPHABET[index] ?? index + 1}매물`;
    } catch (cause) {
      error.value = messageFrom(cause, '매물을 불러오지 못했어요.');
    }
  });

  /** "전세 1억 8,000만원 · 오피스텔 42㎡". 확보 못 한 값은 빼고 잇는다. */
  const spec = computed(() => {
    const found = property.value;
    if (!found) return '';

    const parts: string[] = [];
    if (found.deposit !== null) parts.push(`전세 ${formatKoreanMoney(found.deposit)}`);

    const houseType = found.houseType ? houseTypeLabel(found.houseType) : '';
    const area = found.exclusiveArea === null ? '' : `${found.exclusiveArea}㎡`;
    const house = [houseType, area].filter(Boolean).join(' ');
    if (house) parts.push(house);

    return parts.join(' · ');
  });

  /**
   * 동·호수까지 붙은 주소. 집합건물은 여기까지 맞아야 등기부가 맞다.
   *
   * 여러 화면이 같은 문자열을 만들고 있어서 여기로 올렸다.
   */
  const fullAddress = computed(() => {
    const found = property.value;
    if (!found) return '';
    return found.buildingName ? `${found.roadAddress} (${found.buildingName})` : found.roadAddress;
  });

  const title = computed(() => {
    const found = property.value;
    if (!found) return '';
    return label.value ? `${label.value} · ${found.roadAddress}` : found.roadAddress;
  });

  return { property, label, title, fullAddress, spec, error };
}
