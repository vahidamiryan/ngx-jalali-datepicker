import type { InjectionKey } from 'vue';
import type { NdpLabels } from '@vahidamirian/datepicker-core';

/**
 * Provide a partial set to relabel every picker in the app:
 *
 * ```ts
 * app.provide(NDP_LABELS_KEY, { today: 'Today', clear: 'Clear' })
 * ```
 *
 * A component's own `:labels` prop wins over this.
 */
export const NDP_LABELS_KEY: InjectionKey<Partial<NdpLabels>> = Symbol('ndp-labels');
