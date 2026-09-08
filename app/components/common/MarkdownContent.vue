<script setup lang="ts">
/**
 * API에서 받은 Markdown 본문을 읽기 좋은 HTML로 표시한다.
 *
 * 운영 도구에서 바뀌는 문자열이므로 원문 HTML은 전부 이스케이프한다. 이 컴포넌트가
 * 생성하는 태그만 `v-html`로 보여주므로 임의 스크립트나 이벤트 속성은 실행될 수 없다.
 */
const props = defineProps<{ content: string }>();

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}

function safeUrl(value: string) {
  // 상대 경로와 http(s) 링크만 Markdown 링크로 만든다.
  if (/^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value)) return value;
  return '';
}

function inline(source: string) {
  const codes: string[] = [];
  let value = escapeHtml(source).replace(/`([^`]+)`/g, (_match, code: string) => {
    const token = `@@@COACH_CODE_${codes.length}@@@`;
    codes.push(`<code>${code}</code>`);
    return token;
  });

  value = value
    .replace(/!\[([^\]]*)\]\(([^\s)]+)\)/g, (_match, alt: string, url: string) => {
      const src = safeUrl(url);
      return src ? `<img src="${src}" alt="${alt}" />` : alt;
    })
    .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_match, label: string, url: string) => {
      const href = safeUrl(url);
      return href
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  return value
    .replace(/@@@COACH_CODE_(\d+)@@@/g, (_match, index: string) => codes[Number(index)] ?? '')
    .replace(/\r?\n/g, '<br />');
}

function renderMarkdown(source: string) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(`<p>${inline(paragraph.join('\n'))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      `<${tag}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`,
    );
    list = null;
  };

  for (const line of lines) {
    if (code) {
      if (line.startsWith('```')) {
        blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }
    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      code = [];
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const unordered = /^[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1]?.length ?? 1;
      blocks.push(`<h${level}>${inline(heading[2] ?? '')}</h${level}>`);
    } else if (/^(---|\*\*\*|___)$/.test(line.trim())) {
      flushParagraph();
      flushList();
      blocks.push('<hr />');
    } else if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
    } else if (unordered || ordered) {
      const next = (unordered ?? ordered)!;
      const isOrdered = !!ordered;
      if (!list || list.ordered !== isOrdered) {
        flushParagraph();
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list!.items.push(next[1] ?? '');
    } else {
      flushList();
      paragraph.push(line);
    }
  }

  if (code) blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  flushParagraph();
  flushList();
  return blocks.join('');
}

const rendered = computed(() => renderMarkdown(props.content));
</script>

<template>
  <!-- `rendered`는 원문 HTML을 이스케이프한 뒤 이 컴포넌트가 만든 태그만 담는다. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-content" v-html="rendered" />
</template>

<style scoped>
.markdown-content {
  color: var(--color-ink-hero-body);
  font-size: var(--text-caption2);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  color: var(--color-ink-hero);
  font-weight: 700;
  line-height: 1.4;
}

.markdown-content :deep(h1) {
  font-size: var(--text-headline2);
}

.markdown-content :deep(h2) {
  font-size: var(--text-body3);
}

.markdown-content :deep(h3) {
  font-size: var(--text-row);
}

.markdown-content :deep(p),
.markdown-content :deep(ul),
.markdown-content :deep(ol),
.markdown-content :deep(blockquote),
.markdown-content :deep(pre),
.markdown-content :deep(table) {
  margin: 0.75rem 0;
}

.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child),
.markdown-content :deep(p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p:last-child),
.markdown-content :deep(ul:last-child),
.markdown-content :deep(ol:last-child),
.markdown-content :deep(blockquote:last-child),
.markdown-content :deep(pre:last-child),
.markdown-content :deep(table:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.25rem;
}

.markdown-content :deep(ul) {
  list-style: disc;
}

.markdown-content :deep(ol) {
  list-style: decimal;
}

.markdown-content :deep(li + li) {
  margin-top: 0.25rem;
}

.markdown-content :deep(a) {
  color: var(--color-primary-strong);
  text-decoration: underline;
}

.markdown-content :deep(strong) {
  color: var(--color-ink-hero);
  font-weight: 700;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--color-primary-strong);
  padding-left: 0.75rem;
}

.markdown-content :deep(code) {
  background: var(--color-surface-press);
  border-radius: 0.25rem;
  color: var(--color-ink-hero);
  padding: 0.1rem 0.25rem;
}

.markdown-content :deep(pre) {
  background: var(--color-surface-press);
  border-radius: 0.5rem;
  overflow-x: auto;
  padding: 0.75rem;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-content :deep(img) {
  border-radius: 0.5rem;
  height: auto;
  max-width: 100%;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  display: block;
  max-width: 100%;
  overflow-x: auto;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--color-line);
  padding: 0.5rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background: var(--color-surface-press);
  color: var(--color-ink-hero);
  font-weight: 700;
}
</style>
