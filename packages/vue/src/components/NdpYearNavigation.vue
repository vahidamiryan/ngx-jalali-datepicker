<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue';
import { buildYearNavigation, type CalendarAdapter, type NdpLabels } from '@vahidamirian/datepicker-core';
import NdpIcon from './NdpIcon.vue';

const props = defineProps<{
  adapter: CalendarAdapter;
  month: Date;
  today: Date;
  min: Date | null;
  max: Date | null;
  labels: NdpLabels;
}>();
const emit = defineEmits<{ jump: [year: number] }>();
const search = shallowRef<HTMLInputElement | null>(null);
const query = shallowRef('');
const offset = shallowRef(0);
const navigation = computed(() => buildYearNavigation(
  props.adapter, props.month, props.today, props.min, props.max, offset.value, query.value,
));

onMounted(() => search.value?.focus({ preventScroll: true }));

function submit(): void {
  const { options, searching } = navigation.value;
  if (searching && options[0]) emit('jump', options[0].year);
}
</script>

<template>
  <div class="ndp-year-navigation" role="group" :aria-label="labels.findYear">
    <input ref="search" v-model="query" class="ndp-year-search" type="text" inputmode="numeric"
      autocomplete="off" spellcheck="false" :aria-label="labels.findYear ?? 'Find year'"
      :placeholder="labels.findYear ?? 'Find year'" @keydown.enter.prevent="submit" />
    <div class="ndp-year-results" aria-live="polite">
      <div v-if="navigation.options.length" class="ndp-year-grid"
        :class="{ 'ndp-year-grid--match': navigation.searching }">
        <button v-for="option in navigation.options" :key="option.year" type="button" class="ndp-year-option"
          :aria-current="option.year === navigation.year ? 'true' : undefined"
          @click="emit('jump', option.year)">{{ option.label }}</button>
      </div>
      <p v-else class="ndp-year-empty">{{ labels.noMatchingYear ?? 'Year unavailable' }}</p>
    </div>
    <div v-if="!navigation.searching" class="ndp-year-pages">
      <button type="button" class="ndp-year-option" :aria-label="labels.prev"
        :disabled="!navigation.canPrevious" @click="offset--">
        <NdpIcon name="prev" class="ndp-icon--directional" />
      </button>
      <button type="button" class="ndp-year-option" :aria-label="labels.next"
        :disabled="!navigation.canNext" @click="offset++">
        <NdpIcon name="next" class="ndp-icon--directional" />
      </button>
    </div>
  </div>
</template>

<style src="./NdpYearNavigation.css"></style>
