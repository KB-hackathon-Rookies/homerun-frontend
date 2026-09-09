<script setup lang="ts">
import { useNotificationApi, type NotificationItem } from '~/api/notification';
import { messageFrom } from '~/utils/error';

/**
 * 알림 인박스.
 *
 * 헤더(BrandBar·StageBar)의 알림 아이콘이 여기로 온다. 목록만 보여주고 딥링크·
 * 읽음 처리는 아직 다루지 않는다 — 백엔드 `list()` 를 그대로 그린다.
 */
useHead({ title: '알림' });
definePageMeta({ middleware: 'auth' });

const items = ref<NotificationItem[]>([]);
const pending = ref(true);
const error = ref('');

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

onMounted(async () => {
  try {
    items.value = await useNotificationApi().list();
  } catch (cause) {
    error.value = messageFrom(cause, '알림을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame fill>
    <div class="h-statusbar bg-surface shrink-0" />
    <TopBar title="알림" />

    <main class="scrollbar-hide px-gutter min-h-0 flex-1 overflow-y-auto py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">알림을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>
      <p v-else-if="!items.length" class="text-label2 text-ink-muted pt-10 text-center">
        아직 도착한 알림이 없어요.
      </p>
      <ul v-else class="flex flex-col gap-2.5">
        <li v-for="item in items" :key="item.id">
          <AppCard :class="item.read ? '' : 'border-primary-strong border'">
            <div class="flex items-start gap-2">
              <span v-if="!item.read" class="bg-danger mt-1.5 size-1.5 shrink-0 rounded-full" />
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <p class="text-body2 text-ink-hero font-bold">{{ item.title }}</p>
                <p class="text-label2 text-ink-hero-body">{{ item.body }}</p>
                <p class="text-caption1 text-ink-muted">{{ fmt(item.createdAt) }}</p>
              </div>
            </div>
          </AppCard>
        </li>
      </ul>
    </main>
  </PhoneFrame>
</template>
