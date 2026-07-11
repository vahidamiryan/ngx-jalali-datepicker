<script setup lang="ts">
/**
 * A text field that lets the user type a date directly and opens an
 * NdpDatepicker popover for picking. Typing parses through the active adapter;
 * selecting in the calendar writes the text back. In range mode it shows two
 * fields. Two-way bindable via `v-model`. Port of Angular `DateInputComponent`.
 */
import { computed, ref, watch } from 'vue';
import {
  type CalendarAdapter,
  type DateFilterFn,
  type DateRange,
  type DatepickerMode,
  type NdpAnimation,
  type NdpTheme,
  atMidnight,
  dayKey,
  copyTimeOfDay,
} from '@ndp/core';
import { useCalendarAdapters, type NdpCalendarAdapterSource } from '../adapters';
import NdpDatepicker from './NdpDatepicker.vue';

type Endpoint = 'start' | 'end';

const props = withDefaults(
  defineProps<{
    modelValue?: DateRange;
    calendar?: string;
    theme?: NdpTheme;
    customVars?: Record<string, string>;
    mode?: DatepickerMode;
    animation?: NdpAnimation;
    numberOfMonths?: number;
    min?: Date | null;
    max?: Date | null;
    dateFilter?: DateFilterFn | null;
    showSecondaryDate?: boolean;
    secondaryCalendar?: string | null;
    showFooter?: boolean;
    showTime?: boolean;
    minuteStep?: number;
    placeholder?: string | null;
    inputId?: string | null;
    closeOnSelect?: boolean | null;
    disabled?: boolean;
    adapters?: NdpCalendarAdapterSource[] | null;
  }>(),
  {
    modelValue: () => ({ start: null, end: null }),
    calendar: '',
    theme: 'light',
    customVars: () => ({}),
    mode: 'single',
    animation: 'none',
    numberOfMonths: 1,
    min: null,
    max: null,
    dateFilter: null,
    showSecondaryDate: false,
    secondaryCalendar: null,
    showFooter: true,
    showTime: false,
    minuteStep: 1,
    placeholder: null,
    inputId: null,
    closeOnSelect: null,
    disabled: false,
    adapters: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: DateRange): void;
  (e: 'update:calendar', v: string): void;
  (e: 'dateSelected', v: DateRange): void;
}>();

const adapterList = useCalendarAdapters(props.adapters);
const registry = new Map<string, CalendarAdapter>();
for (const a of adapterList) registry.set(a.id, a);
const calendarIds = adapterList.map((a) => a.id);

const calendarModel = ref<string>(props.calendar || calendarIds[0]);
watch(() => props.calendar, (v) => { if (v && v !== calendarModel.value) calendarModel.value = v; });
watch(calendarModel, (v) => emit('update:calendar', v));

const value = ref<DateRange>(props.modelValue);
watch(() => props.modelValue, (v) => { if (v !== value.value) value.value = v; });

const open = ref(false);
const startText = ref('');
const endText = ref('');
const startInvalid = ref(false);
const endInvalid = ref(false);
const focusedField = ref<Endpoint | null>(null);

const adapter = computed(
  () => registry.get(calendarModel.value) ?? registry.get(calendarIds[0])!,
);
const isRange = computed(() => props.mode === 'range');
const fieldPlaceholder = computed(() => props.placeholder ?? adapter.value.getInputFormatHint());
const effectiveCloseOnSelect = computed(
  () => props.closeOnSelect ?? (props.mode === 'single' && !props.showTime),
);

// Keep the text fields in sync with the value (and active calendar), except
// while the user is typing.
watch(
  [value, adapter],
  () => {
    if (focusedField.value) return;
    const v = value.value;
    const a = adapter.value;
    startText.value = v.start ? a.formatInput(v.start) : '';
    endText.value = v.end ? a.formatInput(v.end) : '';
    startInvalid.value = false;
    endInvalid.value = false;
  },
  { immediate: true, deep: true },
);

function setValue(next: DateRange): void {
  value.value = next;
  emit('update:modelValue', next);
}

function setInvalid(which: Endpoint, invalid: boolean): void {
  if (which === 'start') startInvalid.value = invalid;
  else endInvalid.value = invalid;
}

function onInput(which: Endpoint, raw: string): void {
  const masked = adapter.value.maskInput(raw);
  if (which === 'start') startText.value = masked;
  else endText.value = masked;

  if (masked === '') {
    setInvalid(which, false);
    commitEndpoint(which, null);
    return;
  }
  const parsed = adapter.value.parse(masked);
  if (!parsed) {
    setInvalid(which, true);
    return;
  }
  setInvalid(which, false);
  commitEndpoint(which, parsed);
}

function onFocus(which: Endpoint): void {
  focusedField.value = which;
  open.value = true;
}

function onBlur(): void {
  focusedField.value = null;
}

function commitEndpoint(which: Endpoint, date: Date | null): void {
  let next: DateRange;
  if (!isRange.value) {
    const start =
      date && props.showTime && value.value.start
        ? copyTimeOfDay(date, value.value.start)
        : date;
    next = { start, end: null };
  } else {
    const cur = value.value;
    let start = which === 'start' ? date : cur.start;
    let end = which === 'end' ? date : cur.end;
    if (start && end && dayKey(start) > dayKey(end)) [start, end] = [end, start];
    next = { start, end };
  }
  setValue(next);
  emit('dateSelected', next);
}

function toggle(): void {
  if (props.disabled) return;
  open.value = !open.value;
}

function close(): void {
  open.value = false;
}

function onPanelValue(range: DateRange): void {
  setValue(range);
}

function onPanelSelected(range: DateRange): void {
  emit('dateSelected', range);
  if (effectiveCloseOnSelect.value) close();
}
</script>

<template>
  <div
    class="ndp-input"
    :class="{ 'ndp-input--disabled': disabled }"
    :dir="adapter.direction"
    :data-ndp-theme="theme"
    @keydown.escape="close()"
  >
    <div class="ndp-input__fields">
      <input
        type="text"
        class="ndp-input__field"
        :class="{ 'ndp-input__field--invalid': startInvalid }"
        :id="inputId ?? undefined"
        :value="startText"
        :placeholder="fieldPlaceholder"
        :disabled="disabled"
        autocomplete="off"
        inputmode="numeric"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-invalid="startInvalid"
        @input="onInput('start', ($event.target as HTMLInputElement).value)"
        @focus="onFocus('start')"
        @blur="onBlur()"
      />

      <template v-if="isRange">
        <span class="ndp-input__sep" aria-hidden="true">←</span>
        <input
          type="text"
          class="ndp-input__field"
          :class="{ 'ndp-input__field--invalid': endInvalid }"
          :value="endText"
          :placeholder="fieldPlaceholder"
          :disabled="disabled"
          autocomplete="off"
          inputmode="numeric"
          aria-haspopup="dialog"
          :aria-expanded="open"
          :aria-invalid="endInvalid"
          @input="onInput('end', ($event.target as HTMLInputElement).value)"
          @focus="onFocus('end')"
          @blur="onBlur()"
        />
      </template>

      <button
        type="button"
        class="ndp-input__toggle"
        aria-label="باز کردن تقویم"
        :aria-expanded="open"
        :disabled="disabled"
        @click="toggle()"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      </button>
    </div>

    <template v-if="open">
      <button type="button" class="ndp-input__backdrop" aria-label="بستن" @click="close()"></button>
      <div class="ndp-input__popover" role="dialog">
        <NdpDatepicker
          :theme="theme"
          :custom-vars="customVars"
          :mode="mode"
          :animation="animation"
          :number-of-months="numberOfMonths"
          :min="min"
          :max="max"
          :date-filter="dateFilter"
          :show-secondary-date="showSecondaryDate"
          :secondary-calendar="secondaryCalendar"
          :show-footer="showFooter"
          :show-time="showTime"
          :minute-step="minuteStep"
          :adapters="adapters"
          :model-value="value"
          :calendar="calendarModel"
          @update:calendar="calendarModel = $event"
          @update:model-value="onPanelValue"
          @date-selected="onPanelSelected"
        >
          <template v-if="$slots.day" #day="{ day }">
            <slot name="day" :day="day" />
          </template>
        </NdpDatepicker>
      </div>
    </template>
  </div>
</template>

<style src="./NdpDateInput.css"></style>
