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

const hasLetter = (value: string) => /\p{L}/u.test(value);
const hasDigit = (value: string) => /\p{Nd}/u.test(value);
/** 문자도 숫자도 공백도 아닌 글자 하나. 서버의 `isLetterOrDigit`·`isWhitespace` 판정과 같다. */
const hasSpecial = (value: string) => /[^\p{L}\p{Nd}\s]/u.test(value);
const hasWhitespace = (value: string) => /\s/u.test(value);

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `비밀번호는 ${MIN_LENGTH}자 이상이어야 해요`)
  .max(MAX_LENGTH, `비밀번호는 ${MAX_LENGTH}자까지 쓸 수 있어요`)
  .refine((value) => !hasWhitespace(value), '비밀번호에 공백은 쓸 수 없어요')
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
