<script setup lang="ts">
const { apiBase } = useRuntimeConfig().public
</script>

<template>
  <main class="min-h-dvh bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div class="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 class="text-3xl font-bold tracking-tight">homerun</h1>
      <p class="text-slate-600 dark:text-slate-400">
        Nuxt 4 · TypeScript · Tailwind CSS 4 로 세팅된 프론트엔드입니다.
        <code class="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-800">app/app.vue</code>
        를 지우고 여기서부터 시작하세요.
      </p>
      <dl class="grid gap-2 border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        <div class="flex gap-3">
          <dt class="w-28 shrink-0 text-slate-500">백엔드</dt>
          <dd><code>{{ apiBase }}</code></dd>
        </div>
        <div class="flex gap-3">
          <dt class="w-28 shrink-0 text-slate-500">바꾸려면</dt>
          <dd><code>.env</code> 의 <code>NUXT_PUBLIC_API_BASE</code></dd>
        </div>
      </dl>
    </div>
  </main>
</template>
