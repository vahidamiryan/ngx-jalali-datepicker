<script setup lang="ts">
/**
 * Renders a single month grid. Pure presentational + fully precomputed:
 * `buildMonthView` resolves every per-day flag once in a `computed`, so the
 * template reads only booleans. Selection / navigation state lives in the parent.
 * Faithful port of the Angular `CalendarMonthComponent`.
 */
import { computed } from 'vue';
import {
  buildMonthView,
  type CalendarAdapter,
  type DateFilterFn,
  type DateRange,
  type DayCell,
  type DatepickerMode,
} from '@ndp/core';

const props = withDefaults(
  defineProps<{
    adapter: CalendarAdapter;
    monthStart: Date;
    today: Date;
    mode?: DatepickerMode;
    value?: DateRange;
    hovered?: Date | null;
    min?: Date | null;
    max?: Date | null;
    dateFilter?: DateFilterFn | null;
    /** Numeric key of the roving-focus day, for tabindex management. */
    focusedKey?: number | null;
  }>(),
  {
    mode: 'single',
    value: () => ({ start: null, end: null }),
    hovered: null,
    min: null,
    max: null,
    dateFilter: null,
    focusedKey: null,
  },
);

const emit = defineEmits<{
  (e: 'daySelect', cell: DayCell): void;
  (e: 'dayHover', date: Date | null): void;
}>();

/** The single source of render truth — recomputed only when an input changes. */
const view = computed(() =>
  buildMonthView(props.adapter, props.monthStart, {
    mode: props.mode,
    value: props.value,
    hovered: props.hovered,
    today: props.today,
    min: props.min,
    max: props.max,
    dateFilter: props.dateFilter,
  }),
);

function onSelect(cell: DayCell): void {
  // Padding days from adjacent months are display-only.
  if (cell.isDisabled || !cell.inCurrentMonth) return;
  emit('daySelect', cell);
}

function onEnter(cell: DayCell): void {
  if (!cell.isDisabled && cell.inCurrentMonth) emit('dayHover', cell.date);
}

function onLeave(): void {
  emit('dayHover', null);
}
</script>

<template>
  <div class="ndp-month" role="grid" :aria-label="view.label">
    <div class="ndp-weekdays" role="row">
      <span v-for="(wd, i) in view.weekdays" :key="i" class="ndp-weekday" role="columnheader">{{ wd }}</span>
    </div>

    <div class="ndp-grid">
      <button
        v-for="cell in view.cells"
        :key="cell.key"
        type="button"
        role="gridcell"
        class="ndp-day"
        :data-key="cell.key"
        :class="{
          'ndp-day--outside': !cell.inCurrentMonth,
          'ndp-day--today': cell.isToday,
          'ndp-day--weekend': cell.isWeekend,
          'ndp-day--selected': cell.isSelected,
          'ndp-day--start': cell.isRangeStart,
          'ndp-day--end': cell.isRangeEnd,
          'ndp-day--in-range': cell.isInRange,
          'ndp-day--preview': cell.isPreview,
        }"
        :disabled="cell.isDisabled"
        :tabindex="cell.key === focusedKey && cell.inCurrentMonth ? 0 : -1"
        :aria-pressed="cell.isSelected"
        :aria-current="cell.isToday ? 'date' : undefined"
        @click="onSelect(cell)"
        @mouseenter="onEnter(cell)"
        @mouseleave="onLeave()"
      >
        <slot name="day" :day="cell">
          <span class="ndp-day__label">{{ cell.label }}</span>
        </slot>
      </button>
    </div>
  </div>
</template>

<style src="./NdpCalendarMonth.css"></style>
