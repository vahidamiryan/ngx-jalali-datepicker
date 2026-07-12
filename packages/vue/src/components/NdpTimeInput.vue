<script setup lang="ts">
/**
 * A time-only field: a text input showing `HH:mm` plus a popover with the
 * NdpTimePicker stepper. Its value is a `Date` carrying just the time (day =
 * today unless written in). Two-way bindable via `v-model`. Port of the Angular
 * `TimeInputComponent`.
 */
import { computed, ref, watch } from 'vue';
import {
  type CalendarAdapter,
  type NdpTheme,
  type TimeOfDay,
  atMidnight,
  toLatinDigits,
  getTimeOfDay,
  snapMinutes,
  withTimeOfDay,
  wrapHours,
} from '@vahidamiryan/datepicker-core';
import { useCalendarAdapters, type NdpCalendarAdapterSource } from '../adapters';
import NdpTimePicker from './NdpTimePicker.vue';

const props = withDefaults(
  defineProps<{
    modelValue?: Date | null;
    calendar?: string;
    theme?: NdpTheme;
    minuteStep?: number;
    placeholder?: string;
    inputId?: string | null;
    closeOnSelect?: boolean;
    disabled?: boolean;
    adapters?: NdpCalendarAdapterSource[] | null;
  }>(),
  {
    modelValue: null,
    calendar: '',
    theme: 'light',
    minuteStep: 1,
    placeholder: 'HH:mm',
    inputId: null,
    closeOnSelect: false,
    disabled: false,
    adapters: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: Date | null): void;
  (e: 'update:calendar', v: string): void;
  (e: 'timeSelected', v: Date): void;
}>();

const adapterList = useCalendarAdapters(props.adapters);
const registry = new Map<string, CalendarAdapter>();
for (const a of adapterList) registry.set(a.id, a);
const calendarIds = adapterList.map((a) => a.id);

const calendarModel = ref<string>(props.calendar || calendarIds[0]);
watch(() => props.calendar, (v) => { if (v && v !== calendarModel.value) calendarModel.value = v; });
watch(calendarModel, (v) => emit('update:calendar', v));

const value = ref<Date | null>(props.modelValue);
watch(() => props.modelValue, (v) => { if (v !== value.value) value.value = v; });

const open = ref(false);
const text = ref('');
const invalid = ref(false);
const editing = ref(false);

const adapter = computed(
  () => registry.get(calendarModel.value) ?? registry.get(calendarIds[0])!,
);
const currentTime = computed<TimeOfDay>(() => getTimeOfDay(value.value ?? new Date()));

function render(date: Date, a: CalendarAdapter): string {
  return `${a.formatNumber(date.getHours(), 2)}:${a.formatNumber(date.getMinutes(), 2)}`;
}

// Keep the text field in sync with the value (and active calendar), except while
// the user is typing.
watch(
  [value, adapter],
  () => {
    if (editing.value) return;
    text.value = value.value ? render(value.value, adapter.value) : '';
    invalid.value = false;
  },
  { immediate: true },
);

function mask(raw: string): string {
  const digits = toLatinDigits(raw).replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  const a = adapter.value;
  const h = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const localize = (s: string) => s.replace(/\d/g, (d) => a.formatNumber(+d));
  return m ? `${localize(h)}:${localize(m)}` : localize(h);
}

function parse(txt: string): Date | null {
  const digits = toLatinDigits(txt).replace(/\D/g, '');
  if (digits.length < 3) return null;
  const hours = wrapHours(parseInt(digits.slice(0, 2), 10) || 0);
  const minutes = snapMinutes(parseInt(digits.slice(2, 4), 10) || 0, props.minuteStep);
  const base = value.value ?? atMidnight(new Date());
  return withTimeOfDay(base, hours, minutes);
}

function commit(date: Date | null): void {
  value.value = date;
  emit('update:modelValue', date);
  if (date) emit('timeSelected', date);
}

function onInput(raw: string): void {
  const masked = mask(raw);
  text.value = masked;
  if (masked === '') {
    invalid.value = false;
    commit(null);
    return;
  }
  const parsed = parse(masked);
  if (!parsed) {
    invalid.value = true;
    return;
  }
  invalid.value = false;
  commit(parsed);
}

function onFocus(): void {
  editing.value = true;
  open.value = true;
}

function onBlur(): void {
  editing.value = false;
}

function toggle(): void {
  if (props.disabled) return;
  open.value = !open.value;
}

function close(): void {
  open.value = false;
}

function onTimeChange(time: TimeOfDay): void {
  const base = value.value ?? atMidnight(new Date());
  const next = withTimeOfDay(base, time.hours, time.minutes);
  value.value = next;
  text.value = render(next, adapter.value);
  invalid.value = false;
  emit('update:modelValue', next);
  emit('timeSelected', next);
  if (props.closeOnSelect) close();
}
</script>

<template>
  <div
    class="ndp-root ndp-input"
    :class="{ 'ndp-input--disabled': disabled }"
    :dir="adapter.direction"
    :data-ndp-theme="theme"
    @keydown.escape="close()"
  >
    <div class="ndp-input__fields">
      <input
        type="text"
        class="ndp-input__field"
        :class="{ 'ndp-input__field--invalid': invalid }"
        :id="inputId ?? undefined"
        :value="text"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        inputmode="numeric"
        maxlength="5"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-invalid="invalid"
        @input="onInput(($event.target as HTMLInputElement).value)"
        @focus="onFocus()"
        @blur="onBlur()"
      />

      <button
        type="button"
        class="ndp-input__toggle"
        aria-label="باز کردن انتخاب ساعت"
        :aria-expanded="open"
        :disabled="disabled"
        @click="toggle()"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
    </div>

    <template v-if="open">
      <button type="button" class="ndp-input__backdrop" aria-label="بستن" @click="close()"></button>
      <div class="ndp-input__popover" role="dialog">
        <NdpTimePicker
          :adapter="adapter"
          :time="currentTime"
          :minute-step="minuteStep"
          :disabled="disabled"
          :bordered="false"
          @time-change="onTimeChange"
        />
      </div>
    </template>
  </div>
</template>

<style src="./NdpTimeInput.css"></style>
