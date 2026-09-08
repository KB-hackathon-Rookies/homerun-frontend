import { z } from 'zod';

/**
 * 사용자가 친 숫자를 검사한 뒤에 단위를 바꾼다.
 *
 * 지금까지는 화면마다 `Number(value.replace(/\D/g, ''))` 로 **숫자가 아닌 글자를 지워서**
 * 값을 만들었다. 지우는 것은 검사가 아니다. 다음이 전부 조용히 통과했다.
 *
 * | 사용자가 친 것 | 지워서 만든 값 | 무엇이 잘못됐나 |
 * |---|---|---|
 * | `abc` | 0원 | 못 적은 값이 "0원 확인함" 이 된다 |
 * | `-100` | 1,000,000원 | 음수가 양수로 뒤집힌다 |
 * | `1.5` | 150,000원 | 1.5만 원이 15만 원이 된다 |
 * | 근저당 `1.5` | 15건 | 없는 건수가 만들어진다 |
 *
 * 서버는 이미 바뀐 뒤의 멀쩡한 숫자만 받으므로 원래 입력이 틀렸다는 것을 알 방법이 없다.
 * 그래서 **형식을 먼저 보고, 통과한 것만 단위를 바꾼다.**
 *
 * 빈 값은 오류가 아니라 **미입력**이다. "확인해서 0원" 과 "아직 안 적음" 은 다르므로
 * 여기서 섞지 않는다 — 필수 여부는 화면이 정한다.
 */

/** 천 단위 콤마는 사람이 읽으려고 찍는 것이라 지운다. 그 밖의 글자는 지우지 않고 거절한다. */
const withoutCommas = (value: string) => value.replaceAll(',', '');

/**
 * 만 원 단위 금액. 소수 네 자리까지 받는다 — 만 원의 1/10000 이 곧 1원이라 그보다
 * 잘게 적으면 원 단위로 떨어지지 않는다.
 */
const MANWON_PATTERN = /^\d+(\.\d{1,4})?$/;

/** 1,000억. 이보다 큰 값은 오타로 본다. */
const MAX_WON = 100_000_000_000;

/** 건수 상한. 등기부 근저당이 이만큼 있을 수 없다. */
const MAX_COUNT = 1000;

export const wonFromManwon = z
  .string()
  .transform((value) => withoutCommas(value.trim()))
  .refine((value) => MANWON_PATTERN.test(value), {
    message: '숫자로 입력해주세요. 소수점은 넷째 자리까지 쓸 수 있어요',
  })
  // 만 원 → 원. 0.1 * 10000 같은 부동소수 오차가 남지 않게 반올림한다.
  .transform((value) => Math.round(Number(value) * 10_000))
  .refine((won) => won <= MAX_WON, { message: '금액이 너무 커요. 다시 확인해주세요' });

export const countFromInput = z
  .string()
  .transform((value) => withoutCommas(value.trim()))
  .refine((value) => /^\d+$/.test(value), { message: '건수는 0 이상 정수로 입력해주세요' })
  .transform(Number)
  .refine((count) => count <= MAX_COUNT, { message: '건수가 너무 많아요. 다시 확인해주세요' });

/** 검사 결과. 값이 있으면 `error` 가 없고, 오류가 있으면 `value` 가 없다. */
export interface Parsed<T> {
  value: T | null;
  error: string | null;
}

function parse<T>(schema: z.ZodType<T, string>, input: string): Parsed<T> {
  // 빈 값은 아직 안 적은 것이다. 오류로 세우면 화면에 들어오자마자 빨간 글씨가 뜬다.
  if (!input.trim()) return { value: null, error: null };

  const result = schema.safeParse(input);
  return result.success
    ? { value: result.data, error: null }
    : { value: null, error: result.error.issues[0]?.message ?? '값을 다시 확인해주세요' };
}

/** 만 원 단위로 받은 금액을 원으로. 빈 값은 `{ value: null, error: null }` 이다. */
export const parseManwon = (input: string): Parsed<number> => parse(wonFromManwon, input);

/** 건수. 빈 값은 `{ value: null, error: null }` 이다. */
export const parseCount = (input: string): Parsed<number> => parse(countFromInput, input);

/**
 * 저장된 원 단위 금액을 만 원 입력칸에 되돌려 놓는다.
 *
 * **버리지 않는다.** 3,456,789원을 `345` 로 잘라 보여주면 사용자가 다른 값을 고치고
 * 저장하는 순간 6,789원이 사라진다. `345.6789` 로 그대로 보여주고, 위 파서가 소수
 * 넷째 자리까지 받으므로 다시 저장해도 값이 같다.
 */
export function manwonFromWon(won: number | null | undefined): string {
  if (won === null || won === undefined) return '';
  // 소수점 뒤 남는 0 은 떼어 낸다. 300 만 원을 `300.0000` 으로 보여줄 이유가 없다.
  return String(Number((won / 10_000).toFixed(4)));
}
