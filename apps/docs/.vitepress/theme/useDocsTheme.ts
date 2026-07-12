/**
 * Reactive `'light' | 'dark'` that follows VitePress's own appearance toggle.
 * VitePress stamps a `.dark` class on <html> when dark mode is active; we observe
 * that class so every live picker (Vue and Angular alike) flips with the site
 * theme instead of being stuck on its `light` default.
 */
import { ref, onMounted, onBeforeUnmount, readonly, type Ref } from 'vue';

export type DocsTheme = 'light' | 'dark';

function currentTheme(): DocsTheme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useDocsTheme(): Readonly<Ref<DocsTheme>> {
  const theme = ref<DocsTheme>('light');
  let observer: MutationObserver | null = null;

  onMounted(() => {
    theme.value = currentTheme();
    observer = new MutationObserver(() => {
      const next = currentTheme();
      if (next !== theme.value) theme.value = next;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return readonly(theme);
}
