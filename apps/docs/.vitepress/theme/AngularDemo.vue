<script setup lang="ts">
// Renders a live Angular island for the given example id. Client-only: the
// Angular bootstrap runs in onMounted so it never executes during SSR. The
// island's pickers follow the site's light/dark toggle via useDocsTheme.
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useDocsTheme } from './useDocsTheme';
import type { AngularDemoHandle } from './angular-island';

const props = defineProps<{ id: string }>();

const theme = useDocsTheme();
const host = ref<HTMLElement | null>(null);
const status = ref<'loading' | 'ready' | 'error'>('loading');
let handle: AngularDemoHandle | null = null;

onMounted(async () => {
  if (!host.value) return;
  try {
    const { mountAngularDemo } = await import('./angular-island');
    handle = await mountAngularDemo(host.value, props.id, theme.value);
    status.value = 'ready';
  } catch (err) {
    console.error('[AngularDemo] failed to mount', props.id, err);
    status.value = 'error';
  }
});

// Push site theme changes into the already-mounted island.
watch(theme, (t) => handle?.setTheme(t));

onBeforeUnmount(() => {
  try {
    handle?.app.destroy();
  } catch {
    /* island already torn down */
  }
  handle = null;
});
</script>

<template>
  <div class="ndp-angular-demo">
    <div v-show="status === 'loading'" class="ndp-angular-demo__status">
      Loading live Angular example…
    </div>
    <div v-show="status === 'error'" class="ndp-angular-demo__status ndp-angular-demo__status--error">
      Couldn't load the Angular example. Run <code>npm run build:angular</code> first.
    </div>
    <!-- The Angular island root carries .ndp-demo itself, so no wrapper box here. -->
    <div ref="host" v-show="status === 'ready'"></div>
  </div>
</template>
