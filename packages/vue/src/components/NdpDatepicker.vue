<script setup lang="ts">
/**
 * The orchestrator panel. Owns selection / navigation / focus via the shared
 * `useDatepicker` composable (a faithful port of the Angular DatepickerComponent
 * state machine on top of @ndp/core). Two-way bindable via `v-model` (value) and
 * `v-model:calendar`. A `#day` scoped slot customizes the day cell — the Vue
 * equivalent of Angular's `ndpDayCell` content projection.
 */
import { computed, ref, toRef, watch } from 'vue';
import type {
  DateFilterFn,
  DateRange,
  DatepickerMode,
  NdpAnimation,
  NdpTheme,
} from '@ndp/core';
import { useCalendarAdapters, type NdpCalendarAdapterSource } from '../adapters';
import { useDatepicker } from '../composables/useDatepicker';
import NdpCalendarMonth from './NdpCalendarMonth.vue';
import NdpCalendarPeriod from './NdpCalendarPeriod.vue';
import NdpTimePicker from './NdpTimePicker.vue';

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
    showFooter?: boolean;
    showSummary?: boolean;
    showToday?: boolean;
    showClear?: boolean;
    showCalendarToggle?: boolean;
    showQuickNav?: boolean;
    showInput?: boolean;
    showTime?: boolean;
    minuteStep?: number;
    showSecondaryDate?: boolean;
    secondaryCalendar?: string | null;
    disabled?: boolean;
    /** Per-component calendar override; otherwise the app-level plugin's adapters. */
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
    showFooter: true,
    showSummary: true,
    showToday: true,
    showClear: true,
    showCalendarToggle: true,
    showQuickNav: true,
    showInput: false,
    showTime: false,
    minuteStep: 1,
    showSecondaryDate: false,
    secondaryCalendar: null,
    disabled: false,
    adapters: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: DateRange): void;
  (e: 'update:calendar', v: string): void;
  (e: 'dateSelected', v: DateRange): void;
}>();

const host = ref<HTMLElement | null>(null);

// Bridge the value/calendar models between props (immutable) and the composable's
// mutable refs, emitting the corresponding update events on change.
const valueModel = ref<DateRange>(props.modelValue);
watch(() => props.modelValue, (v) => { if (v !== valueModel.value) valueModel.value = v; });
watch(valueModel, (v) => emit('update:modelValue', v), { deep: true });

const calendarModel = ref<string>(props.calendar);
watch(() => props.calendar, (v) => { if (v && v !== calendarModel.value) calendarModel.value = v; });
watch(calendarModel, (v) => emit('update:calendar', v));

const adapterList = useCalendarAdapters(props.adapters);

const dp = useDatepicker({
  adapters: adapterList,
  mode: toRef(props, 'mode'),
  numberOfMonths: toRef(props, 'numberOfMonths'),
  min: toRef(props, 'min'),
  max: toRef(props, 'max'),
  dateFilter: toRef(props, 'dateFilter'),
  animation: toRef(props, 'animation'),
  showTime: toRef(props, 'showTime'),
  minuteStep: toRef(props, 'minuteStep'),
  showSecondaryDate: toRef(props, 'showSecondaryDate'),
  secondaryCalendar: toRef(props, 'secondaryCalendar'),
  showInput: toRef(props, 'showInput'),
  value: valueModel,
  calendar: calendarModel,
  onSelected: (range) => emit('dateSelected', range),
  getHost: () => host.value,
});

watch(() => props.disabled, (d) => dp.setDisabled(d), { immediate: true });

// Reflect theme + custom CSS vars on the host (mirrors the Angular host bindings).
const styleVars = computed(() => ({ ...props.customVars }) as Record<string, string>);
</script>

<template>
  <div
    ref="host"
    class="ndp-root"
    :dir="dp.adapter.value.direction"
    :data-ndp-theme="theme"
    :style="styleVars"
    @keydown="dp.onKeydown"
  >
    <div
      class="ndp-panel"
      :class="{
        'ndp-panel--disabled': dp.disabled.value,
        'ndp-panel--slide-prev': dp.slideDir.value === 'prev',
        'ndp-panel--slide-next': dp.slideDir.value === 'next',
      }"
      @animationend="dp.onSlideEnd"
    >
      <!-- Typed input row -->
      <div v-if="dp.inputVisible.value" class="ndp-input-row">
        <input
          type="text"
          class="ndp-input-field"
          :class="{ 'ndp-input-field--invalid': dp.startInvalid.value }"
          :value="dp.startText.value"
          :placeholder="dp.adapter.value.getInputFormatHint()"
          autocomplete="off"
          inputmode="numeric"
          :aria-invalid="dp.startInvalid.value"
          @input="dp.onInputType('start', ($event.target as HTMLInputElement).value)"
          @focus="dp.onInputFocus('start')"
          @blur="dp.onInputBlur()"
        />
        <template v-if="mode === 'range'">
          <span class="ndp-input-row__sep" aria-hidden="true">←</span>
          <input
            type="text"
            class="ndp-input-field"
            :class="{ 'ndp-input-field--invalid': dp.endInvalid.value }"
            :value="dp.endText.value"
            :placeholder="dp.adapter.value.getInputFormatHint()"
            autocomplete="off"
            inputmode="numeric"
            :aria-invalid="dp.endInvalid.value"
            @input="dp.onInputType('end', ($event.target as HTMLInputElement).value)"
            @focus="dp.onInputFocus('end')"
            @blur="dp.onInputBlur()"
          />
        </template>
      </div>

      <!-- Day view -->
      <template v-if="dp.viewMode.value === 'day'">
        <div class="ndp-months">
          <div
            v-for="(m, i) in dp.visibleMonths.value"
            :key="m.getTime()"
            class="ndp-month-block"
          >
            <div class="ndp-month-title">
              <button
                v-if="i === 0"
                type="button"
                class="ndp-nav"
                aria-label="قبلی"
                :disabled="!dp.canGoPrev.value"
                @click="dp.goPrev()"
              >
                ‹
              </button>
              <span v-else class="ndp-nav-spacer" aria-hidden="true"></span>

              <span v-if="showQuickNav" class="ndp-month-title__nav">
                <span class="ndp-quick-nav">
                  <!-- Month dropdown -->
                  <span class="ndp-dropdown">
                    <button
                      type="button"
                      class="ndp-title-btn"
                      aria-haspopup="listbox"
                      :aria-expanded="dp.monthMenuOpen.value === i"
                      @click="dp.toggleMonthMenu(i)"
                    >
                      {{ dp.blockMonthName(m) }} <span aria-hidden="true">▾</span>
                    </button>
                    <template v-if="dp.monthMenuOpen.value === i">
                      <button
                        type="button"
                        class="ndp-menu-backdrop"
                        aria-label="بستن"
                        @click="dp.closeMenus()"
                      ></button>
                      <ul class="ndp-menu ndp-menu--month" role="listbox">
                        <li v-for="opt in dp.monthOptions.value" :key="opt.month" role="none">
                          <button
                            type="button"
                            role="option"
                            class="ndp-menu__item"
                            :class="{ 'ndp-menu__item--active': opt.month === dp.blockMonthNumber(m) }"
                            :aria-selected="opt.month === dp.blockMonthNumber(m)"
                            @click="dp.pickMonth(opt.month, i)"
                          >
                            {{ opt.label }}
                          </button>
                        </li>
                      </ul>
                    </template>
                  </span>

                  <!-- Year dropdown -->
                  <span class="ndp-dropdown">
                    <button
                      type="button"
                      class="ndp-title-btn"
                      aria-haspopup="listbox"
                      :aria-expanded="dp.yearMenuOpen.value === i"
                      @click="dp.toggleYearMenu(i)"
                    >
                      {{ dp.blockYearLabel(m) }} <span aria-hidden="true">▾</span>
                    </button>
                    <template v-if="dp.yearMenuOpen.value === i">
                      <button
                        type="button"
                        class="ndp-menu-backdrop"
                        aria-label="بستن"
                        @click="dp.closeMenus()"
                      ></button>
                      <ul class="ndp-menu ndp-menu--year" role="listbox">
                        <li v-for="opt in dp.yearOptions.value" :key="opt.year" role="none">
                          <button
                            type="button"
                            role="option"
                            class="ndp-menu__item"
                            :class="{ 'ndp-menu__item--active': opt.year === dp.blockYearNumber(m) }"
                            :aria-selected="opt.year === dp.blockYearNumber(m)"
                            @click="dp.pickYear(opt.year, i)"
                          >
                            {{ opt.label }}
                          </button>
                        </li>
                      </ul>
                    </template>
                  </span>
                </span>
                <small v-if="dp.secondaryAdapter.value" class="ndp-month-title__secondary">{{
                  dp.secondaryMonthLabel(m)
                }}</small>
              </span>
              <span v-else class="ndp-month-title__label">
                {{ dp.monthLabel(m) }}
                <small v-if="dp.secondaryAdapter.value" class="ndp-month-title__secondary">{{
                  dp.secondaryMonthLabel(m)
                }}</small>
              </span>

              <button
                v-if="i === dp.visibleMonths.value.length - 1"
                type="button"
                class="ndp-nav"
                aria-label="بعدی"
                :disabled="!dp.canGoNext.value"
                @click="dp.goNext()"
              >
                ›
              </button>
              <span v-else class="ndp-nav-spacer" aria-hidden="true"></span>
            </div>

            <div class="ndp-calendar-wrap">
              <NdpCalendarMonth
                :adapter="dp.adapter.value"
                :month-start="m"
                :mode="mode"
                :value="valueModel"
                :hovered="dp.hovered.value"
                :today="dp.today.value"
                :min="min"
                :max="max"
                :date-filter="dateFilter"
                :focused-key="dp.focusedKey.value"
                @day-select="dp.onDaySelect"
                @day-hover="dp.onDayHover"
              >
                <template v-if="$slots.day" #day="{ day }">
                  <slot name="day" :day="day" />
                </template>
              </NdpCalendarMonth>
            </div>
          </div>
        </div>

        <NdpTimePicker
          v-if="dp.timeVisible.value"
          :adapter="dp.adapter.value"
          :time="dp.currentTime.value"
          :minute-step="minuteStep"
          :disabled="dp.disabled.value"
          @time-change="dp.onTimeChange"
        />
      </template>

      <!-- Month / year picker view -->
      <template v-else>
        <div class="ndp-month-block">
          <div class="ndp-month-title ndp-month-title--period">
            <button
              type="button"
              class="ndp-nav"
              aria-label="قبلی"
              :disabled="!dp.canGoPrev.value"
              @click="dp.goPrev()"
            >
              ‹
            </button>

            <span v-if="dp.viewMode.value === 'month' && showQuickNav" class="ndp-dropdown">
              <button
                type="button"
                class="ndp-title-btn"
                aria-haspopup="listbox"
                :aria-expanded="dp.yearMenuOpen.value === 0"
                @click="dp.toggleYearMenu()"
              >
                {{ dp.periodHeading.value }} <span aria-hidden="true">▾</span>
              </button>
              <template v-if="dp.yearMenuOpen.value === 0">
                <button
                  type="button"
                  class="ndp-menu-backdrop"
                  aria-label="بستن"
                  @click="dp.closeMenus()"
                ></button>
                <ul class="ndp-menu ndp-menu--year" role="listbox">
                  <li v-for="opt in dp.yearOptions.value" :key="opt.year" role="none">
                    <button
                      type="button"
                      role="option"
                      class="ndp-menu__item"
                      :class="{ 'ndp-menu__item--active': opt.year === dp.activeYearNumber.value }"
                      :aria-selected="opt.year === dp.activeYearNumber.value"
                      @click="dp.pickYear(opt.year)"
                    >
                      {{ opt.label }}
                    </button>
                  </li>
                </ul>
              </template>
            </span>
            <span v-else class="ndp-month-title__label">{{ dp.periodHeading.value }}</span>

            <button
              type="button"
              class="ndp-nav"
              aria-label="بعدی"
              :disabled="!dp.canGoNext.value"
              @click="dp.goNext()"
            >
              ›
            </button>
          </div>

          <div class="ndp-calendar-wrap">
            <NdpCalendarPeriod
              :key="dp.activePeriodView.value.label"
              :view="dp.activePeriodView.value"
              :focused-key="dp.periodFocusedKey.value"
              @period-select="dp.onPeriodSelect"
            />
          </div>
        </div>
      </template>

      <!-- Footer -->
      <div v-if="showFooter" class="ndp-footer">
        <div v-if="showSummary" class="ndp-summary">
          <span v-if="valueModel.start" class="ndp-summary__chip">
            <span class="ndp-summary__text">
              {{ dp.adapter.value.format(valueModel.start) }}
              <small v-if="dp.secondaryAdapter.value" class="ndp-summary__secondary">{{
                dp.secondaryFormat(valueModel.start)
              }}</small>
            </span>
            <button
              v-if="mode === 'range'"
              type="button"
              class="ndp-summary__clear-btn"
              aria-label="پاک کردن تاریخ شروع"
              @click="dp.clearStart()"
            >
              ✕
            </button>
          </span>
          <template v-if="valueModel.end">
            <span class="ndp-summary__sep">←</span>
            <span class="ndp-summary__chip">
              <span class="ndp-summary__text">
                {{ dp.adapter.value.format(valueModel.end) }}
                <small v-if="dp.secondaryAdapter.value" class="ndp-summary__secondary">{{
                  dp.secondaryFormat(valueModel.end)
                }}</small>
              </span>
              <button
                v-if="mode === 'range'"
                type="button"
                class="ndp-summary__clear-btn"
                aria-label="پاک کردن تاریخ پایان"
                @click="dp.clearEnd()"
              >
                ✕
              </button>
            </span>
          </template>
        </div>

        <div class="ndp-actions">
          <button
            v-if="showCalendarToggle && dp.canToggleCalendar.value"
            type="button"
            class="ndp-btn"
            @click="dp.toggleCalendar()"
          >
            {{ calendarModel === 'jalali' ? 'میلادی' : 'شمسی' }}
          </button>
          <button v-if="showToday" type="button" class="ndp-btn" @click="dp.goToToday()">امروز</button>
          <button
            v-if="showClear"
            type="button"
            class="ndp-btn"
            :disabled="!valueModel.start"
            @click="dp.clear()"
          >
            پاک کردن
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./NdpDatepicker.css"></style>
