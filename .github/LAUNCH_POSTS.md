# Launch posts — Vue release + monorepo

Copy-paste ready. Update the shortlinks before posting.

Links:
- Demo & docs: https://vahidamiryan.github.io/ngx-jalali-datepicker/
- GitHub: https://github.com/vahidamiryan/ngx-jalali-datepicker
- npm (Angular): https://www.npmjs.com/package/@vahidamiryan/ngx-jalali-datepicker
- npm (Vue): https://www.npmjs.com/package/@vahidamiryan/vue-datepicker

---

## LinkedIn (فارسی) — نسخهٔ اصلی

سلام دوستان 👋

چند وقت پیش `ngx-jalali-datepicker` رو برای Angular منتشر کردم. بازخوردها یک درخواست مشترک داشت: **«نسخهٔ Vue کو؟»**

خب حالا هست — و فقط یک پورت ساده نیست 👇

کل منطق تقویم (تبدیل شمسی/میلادی/قمری، ساخت گرید ماه، منطق انتخاب) رو کشیدم بیرون توی یک **هستهٔ Headless و مستقل از فریمورک** به اسم `@vahidamiryan/datepicker-core`. حالا نسخهٔ Angular و Vue دقیقاً **همون یک هسته** رو استفاده می‌کنن.

یعنی چی؟ یعنی هر باگ‌فیکس یا فیچر جدید، **همزمان توی هر دو فریمورک** اعمال می‌شه — نه دو تا کدبیس جدا که از هم عقب بیفتن.

✅ سه تقویم آماده: شمسی، میلادی، قمری (تبدیل‌ها با Intl پلتفرم verify شدن)
✅ Angular 20+ کاملاً Zoneless + Signals + OnPush
✅ Vue 3 با Composition API و `v-model`
✅ نمایش دوتقویمی (میلادی زیر شمسی)، رنج، انتخاب ماه/سال، ورودی متنی با پارس، انتخاب ساعت
✅ تم دارک/لایت، کاملاً قابل شخصی‌سازی با CSS variables، پشتیبانی RTL
✅ معماری Headless — می‌تونی UI کاملاً دلخواه خودت رو روی هسته بسازی

دموی زنده (هم Angular هم Vue، توی همون صفحه): 
🔗 https://vahidamiryan.github.io/ngx-jalali-datepicker/

اگه با Angular یا Vue کار می‌کنی و پروژه‌ات تقویم شمسی لازم داره، خوشحال می‌شم امتحانش کنی و نظرت رو بگی — چه باگ، چه feature request، چه انتقاد. ⭐️ گیت‌هاب هم اگه به‌کارت اومد، انگیزه‌ست 🙏

#angular #vue #vuejs #javascript #typescript #frontend #opensource #datepicker #jalali #persiancalendar

---

## Twitter / X (English) — thread

**Tweet 1/4**
I open-sourced a Jalali (Persian) / Gregorian / Hijri date picker for **both Angular 20+ and Vue 3** — sharing one headless core, so behavior is identical and fixes land in both at once. 🧵

Live demo (Angular + Vue, same page): https://vahidamiryan.github.io/ngx-jalali-datepicker/

**Tweet 2/4**
The trick: all calendar math, adapters, selection and month-grid building live in a pure-TS `@vahidamiryan/datepicker-core` with **zero framework deps**.

Angular (zoneless + signals + OnPush) and Vue (Composition API + v-model) are thin layers on top. One engine, two idiomatic APIs.

**Tweet 3/4**
Batteries included:
• 3 calendars, verified vs. Intl
• range, multi-month, month/year pickers
• typed input with parsing, time-of-day
• dual-script (Gregorian under Jalali)
• dark/light, fully themeable via CSS vars, RTL
• keyboard nav, forms integration

**Tweet 4/4**
Free & MIT. If you build in Angular or Vue and need a Persian calendar, I'd love your feedback — bugs, feature requests, or a ⭐️.

npm (Angular): @vahidamiryan/ngx-jalali-datepicker
npm (Vue): @vahidamiryan/vue-datepicker

#angular #vuejs #javascript #opensource

---

## Reddit / dev.to angle (optional, longer form)

Title: "One headless core, two frameworks: how I shipped the same date picker for Angular and Vue"

Lead with the architecture problem (two codebases drift apart) → the headless-core solution →
the concrete win (a selection/parse bug fixed once shows up in both). Link the live demo where
the Angular and Vue pickers sit side by side on the same page as proof.
Good subreddits: r/angular, r/vuejs, r/javascript. Also dev.to with tags #angular #vue #opensource.
