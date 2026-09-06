<script setup lang="ts">
/**
 * 약관 동의 묶음.
 *
 * 전체 동의 하나와 개별 항목들. 전체 동의는 아래 항목의 상태를 그대로 따라가고,
 * 누르면 전부를 그 반대로 바꾼다.
 *
 * 가입과 오픈뱅킹이 같은 모양을 쓴다. 항목만 다르다.
 */
export interface Term {
  id: string;
  label: string;
  /** 필수 항목이 하나라도 빠지면 다음으로 넘어갈 수 없다. */
  required: boolean;
}

const { terms } = defineProps<{ terms: Term[] }>();

const agreed = defineModel<Record<string, boolean>>({ required: true });

const allAgreed = computed({
  get: () => terms.every((term) => agreed.value[term.id]),
  set: (value: boolean) => {
    agreed.value = Object.fromEntries(terms.map((term) => [term.id, value]));
  },
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="border-line rounded-field h-button flex items-center px-2.5">
      <AppCheckbox v-model="allAgreed">전체 동의하기</AppCheckbox>
    </div>

    <div class="border-line rounded-field flex flex-col px-2.5 py-1">
      <div
        v-for="(term, index) in terms"
        :key="term.id"
        class="flex items-center gap-2.5 p-2.5"
        :class="index < terms.length - 1 ? 'border-line border-b' : ''"
      >
        <AppCheckbox v-model="agreed[term.id]">
          {{ term.label }}
          <template #trailing>
            <AppIcon name="arrow-right" class="text-line-arrow size-4 shrink-0" />
          </template>
        </AppCheckbox>
      </div>
    </div>
  </div>
</template>
