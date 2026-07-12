<script setup lang="ts">
// Renders a live Angular island for the given example id. Client-only: the
// Angular bootstrap runs in onMounted so it never executes during SSR.
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { ApplicationRef } from '@angular/core';

const props = defineProps<{ id: string }>();

const host = ref<HTMLElement | null>(null);
const status = ref<'loading' | 'ready' | 'error'>('loading');
let appRef: ApplicationRef | null = null;

onMounted(async () => {
  if (!host.value) return;
  try {
    const { mountAngularDemo } = await import('./angular-island');
    appRef = await mountAngularDemo(host.value, props.id);
    status.value = 'ready';
  } catch (err) {
    console.error('[AngularDemo] failed to mount', props.id, err);
    status.value = 'error';
  }
});

onBeforeUnmount(() => {
  try {
    appRef?.destroy();
  } catch {
    /* island already torn down */
  }
  appRef = null;
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
    <div ref="host" v-show="status === 'ready'"></div>
  </div>
</template>
