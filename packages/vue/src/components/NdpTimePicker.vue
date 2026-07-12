<script setup lang="ts">
/**
 * Two spinner fields (hours : minutes) for the optional time-of-day feature.
 * Presentational: the parent owns the time on the value and feeds it in as a
 * TimeOfDay; every change emits back through `timeChange`. Digits render in the
 * active calendar's own numerals. Port of the Angular `TimePickerComponent`.
 */
import { computed } from 'vue';
import {
  type CalendarAdapter,
  type TimeOfDay,
  normalizeStep,
  snapMinutes,
  stepMinutes as stepMinutesCore,
  wrapHours,
  toLatinDigits,
} from '@vahidamiryan/datepicker-core';

const props = withDefaults(
  defineProps<{
    adapter: CalendarAdapter;
    time: TimeOfDay;
    minuteStep?: number;
    disabled?: boolean;
    /** Draw the top divider that separates the stepper from a grid above it. */
    bordered?: boolean;
  }>(),
  { minuteStep: 1, disabled: false, bordered: true },
);

const emit = defineEmits<{ (e: 'timeChange', time: TimeOfDay): void }>();

const step = computed(() => normalizeStep(props.minuteStep));
const hoursText = computed(() => props.adapter.formatNumber(props.time.hours, 2));
const minutesText = computed(() => props.adapter.formatNumber(props.time.minutes, 2));

function fire(hours: number, minutes: number): void {
  emit('timeChange', { hours, minutes });
}

function stepHours(dir: -1 | 1): void {
  if (props.disabled) return;
  fire(wrapHours(props.time.hours + dir), props.time.minutes);
}

function stepMinutesBy(dir: -1 | 1): void {
  if (props.disabled) return;
  fire(props.time.hours, stepMinutesCore(props.time.minutes, step.value, dir));
}

function readDigits(raw: string): number | null {
  const digits = toLatinDigits(raw).replace(/\D/g, '');
  if (!digits) return null;
  return parseInt(digits, 10);
}

function onHoursInput(raw: string): void {
  const n = readDigits(raw);
  if (n === null) return;
  fire(wrapHours(n), props.time.minutes);
}

function onMinutesInput(raw: string): void {
  const n = readDigits(raw);
  if (n === null) return;
  fire(props.time.hours, snapMinutes(n, step.value));
}

function onHoursKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    stepHours(1);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    stepHours(-1);
  }
}

function onMinutesKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    stepMinutesBy(1);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    stepMinutesBy(-1);
  }
}
</script>

<template>
  <div class="ndp-time" :class="{ 'ndp-time--disabled': disabled, 'ndp-time--bordered': bordered }">
    <!-- Hours -->
    <span class="ndp-time__field">
      <button
        type="button"
        class="ndp-time__step"
        aria-label="افزایش ساعت"
        tabindex="-1"
        :disabled="disabled"
        @click="stepHours(1)"
      >
        ▲
      </button>
      <input
        type="text"
        class="ndp-time__input"
        inputmode="numeric"
        autocomplete="off"
        aria-label="ساعت"
        maxlength="2"
        :disabled="disabled"
        :value="hoursText"
        @input="onHoursInput(($event.target as HTMLInputElement).value)"
        @keydown="onHoursKeydown"
      />
      <button
        type="button"
        class="ndp-time__step"
        aria-label="کاهش ساعت"
        tabindex="-1"
        :disabled="disabled"
        @click="stepHours(-1)"
      >
        ▼
      </button>
    </span>

    <span class="ndp-time__sep" aria-hidden="true">:</span>

    <!-- Minutes -->
    <span class="ndp-time__field">
      <button
        type="button"
        class="ndp-time__step"
        aria-label="افزایش دقیقه"
        tabindex="-1"
        :disabled="disabled"
        @click="stepMinutesBy(1)"
      >
        ▲
      </button>
      <input
        type="text"
        class="ndp-time__input"
        inputmode="numeric"
        autocomplete="off"
        aria-label="دقیقه"
        maxlength="2"
        :disabled="disabled"
        :value="minutesText"
        @input="onMinutesInput(($event.target as HTMLInputElement).value)"
        @keydown="onMinutesKeydown"
      />
      <button
        type="button"
        class="ndp-time__step"
        aria-label="کاهش دقیقه"
        tabindex="-1"
        :disabled="disabled"
        @click="stepMinutesBy(-1)"
      >
        ▼
      </button>
    </span>
  </div>
</template>

<style src="./NdpTimePicker.css"></style>
