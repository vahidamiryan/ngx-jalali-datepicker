<script setup lang="ts">
import { computed, inject } from 'vue';
import { resolveIcons, type NdpIconName, type NdpIconSet } from '@vahidamirian/datepicker-core';

import { NDP_ICONS_KEY } from '../icons';

const props = defineProps<{ name: NdpIconName }>();

const injected = inject<Partial<NdpIconSet> | undefined>(NDP_ICONS_KEY, undefined);
const markup = computed(() => resolveIcons(injected)[props.name]);
</script>

<template>
  <svg
    class="ndp-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="markup"
  />
</template>
