<script setup lang="ts">
/**
 * Renders a grid of selectable periods — twelve months, or one page of years.
 * Purely presentational: the parent builds the PeriodView (all flags precomputed)
 * and owns selection / navigation. Port of the Angular `CalendarPeriodComponent`.
 */
import type { PeriodCell, PeriodView } from '@vahidamiryan/datepicker-core';

withDefaults(
  defineProps<{
    view: PeriodView;
    /** Numeric key of the roving-focus cell, for tabindex management. */
    focusedKey?: number | null;
  }>(),
  { focusedKey: null },
);

const emit = defineEmits<{ (e: 'periodSelect', cell: PeriodCell): void }>();

function onSelect(cell: PeriodCell): void {
  if (cell.isDisabled) return;
  emit('periodSelect', cell);
}
</script>

<template>
  <div class="ndp-period" role="grid" :aria-label="view.label">
    <div class="ndp-period-grid">
      <button
        v-for="cell in view.cells"
        :key="cell.key"
        type="button"
        role="gridcell"
        class="ndp-period-cell"
        :data-key="cell.key"
        :class="{
          'ndp-period-cell--current': cell.isCurrent,
          'ndp-period-cell--selected': cell.isSelected,
        }"
        :disabled="cell.isDisabled"
        :tabindex="cell.key === focusedKey ? 0 : -1"
        :aria-pressed="cell.isSelected"
        :aria-current="cell.isCurrent ? 'date' : undefined"
        @click="onSelect(cell)"
      >
        <span class="ndp-period-cell__label">{{ cell.label }}</span>
      </button>
    </div>
  </div>
</template>

<style src="./NdpCalendarPeriod.css"></style>
