import { z } from 'zod';

/**
 * 가입 입력 규칙. **서버와 같은 조건을 화면에서 먼저 본다.**
 *
 * 지금까지 화면은 비밀번호를 8자 이상인지만 봤다. 서버(`StrongPasswordValidator`)는 그보다
 * 많은 것을 요구해서, `abcdefgh` 로도 다음 화면으로 넘어간 뒤 휴대전화 인증과 주소 입력까지
 * 다 마치고 **마지막 가입 요청에서야 거절**됐다. 되돌아와 고칠 곳도 알려주지 않는다.
 *
 * 그래서 서버 조건을 그대로 옮긴다. 서버가 바뀌면 여기도 같이 바꾼다 — 화면이 더 느슨하면
 * 위와 같은 일이 다시 생기고, 더 빡빡하면 서버가 받아 주는 값을 화면이 막는다.
 */

/** 서버 `StrongPasswordValidator` 와 같은 값. */
const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

/**
 * 허용 문자를 **출력 가능한 ASCII(33~126, 공백 제외)** 로 못 박는다.
 *
 * 전에는 `\p{L}`·`\p{Nd}` 로 유니코드 문자·숫자를 다 받았는데, 서버 Java `Character`
 * 판정과 미묘하게 달랐다 — U+00A0(비분리공백)은 프론트만 거절, 제어문자 U+001C 는
 * 서버만 거절, `𐐀`(서로게이트)는 프론트만 통과. 그래서 양쪽을 ASCII 로 좁혀
 * JS 정규식과 Java 문자코드 판정이 정확히 같은 집합을 보게 한다. 이 정책은 서버
 * `StrongPasswordValidator` 와 짝이므로 한쪽을 바꾸면 다른 쪽도 같이 바꾼다.
 */
const ASCII_ONLY = /^[!-~]+$/; // 33~126. 공백(32)·제어문자·유니코드·이모지·서로게이트 제외
const hasLetter = (value: string) => /[A-Za-z]/.test(value);
const hasDigit = (value: string) => /[0-9]/.test(value);
// ASCII_ONLY 를 함께 강제하므로, 영숫자가 아닌 글자는 곧 ASCII 특수문자다.
const hasSpecial = (value: string) => /[^A-Za-z0-9]/.test(value);

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `비밀번호는 ${MIN_LENGTH}자 이상이어야 해요`)
  .max(MAX_LENGTH, `비밀번호는 ${MAX_LENGTH}자까지 쓸 수 있어요`)
  .refine(
    (value) => ASCII_ONLY.test(value),
    '영문·숫자·특수문자만 쓸 수 있어요 (공백·한글·이모지 불가)',
  )
  .refine(
    (value) => hasLetter(value) && hasDigit(value) && hasSpecial(value),
    '영문·숫자·특수문자를 각각 하나 이상 넣어주세요',
  );

export const emailSchema = z
  .string()
  .trim()
  .min(1, '이메일을 입력해주세요')
  .max(255, '이메일이 너무 길어요')
  .pipe(z.email('이메일 형식이 올바르지 않아요'));

/** 첫 오류 문구만 꺼낸다. 빈 입력은 아직 안 적은 것이라 오류로 세우지 않는다. */
export function messageOf(schema: z.ZodType<unknown, string>, input: string): string {
  if (!input) return '';
  const result = schema.safeParse(input);
  return result.success ? '' : (result.error.issues[0]?.message ?? '값을 다시 확인해주세요');
}

/** 스키마를 통과하는가. 빈 값도 통과하지 못한다 — 필수 여부 판단에 쓴다. */
export const passes = (schema: z.ZodType<unknown, string>, input: string) =>
  schema.safeParse(input).success;
