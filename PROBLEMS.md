# KPI Card Plugin — Проблемы и решения

## Контекст

Разработка визуал-плагина `superset-plugin-chart-kpi-card` для Apache Superset 6.0.
Плагин должен точно воспроизводить HTML-макет `kpi-cards-v1.html`: entry-анимации, counter hero-числа, toggle-переключение, hover-эффекты, dark mode.

---

## Проблема 1: Анимации не работают вообще (КОРНЕВАЯ)

### Симптом
Все CSS-анимации (card entry, subtitle slide, pill pop, toggle) — мёртвые. Карточка рендерится мгновенно без каких-либо визуальных эффектов. Проблема воспроизводилась стабильно, 4 попытки починить не давали результата.

### Ложные следы
1. `@emotion/react` `keyframes` — не резолвится вне `superset-frontend` workspace
2. Строковые `@keyframes` внутри `styled` — Emotion/Stylis не хойстит их корректно
3. `keyframes` из `@superset-ui/core` — всё ещё не инжектится в DOM

### Реальная причина
В `styles.ts` была media query:
```css
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
}
```
Windows 11 с отключённой настройкой **«Показывать анимации»** (Settings → Accessibility → Visual effects) активирует `prefers-reduced-motion: reduce`. Это **убивало все анимации** через `!important`, делая любые попытки починить keyframes бесполезными.

### Решение
Удалили `@media (prefers-reduced-motion: reduce)` блок целиком. Анимации — ключевая часть UX визуализации, а не декоративный эффект. Оставили комментарий с ссылкой на WCAG 2.3.3 для будущих разработчиков.

### Урок
Всегда проверяй CSS media queries и OS-уровневые accessibility настройки, прежде чем искать проблему в JS/библиотеках.

---

## Проблема 2: Emotion/Stylis не поддерживает @keyframes в styled components

### Симптом
`@keyframes` правила, написанные внутри styled-component template literal, не попадают в DOM — Stylis (CSS-препроцессор Emotion) скопирует их, но не хойстит на глобальный уровень.

### Решение
Вынесли все `@keyframes` в строковую константу `KEYFRAMES_CSS` и инжектим через `<style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />` в JSX. Это plain CSS — 100% надёжно, без зависимости от Emotion runtime.

---

## Проблема 3: Неверная анимация hero-числа

### Симптом
Hero-число (основное значение KPI) появлялось с translateY + scale анимацией (`kpi-hero-in`). В макете числа **считают от 0 до целевого значения** (counter animation).

### Реальная причина
Макет использует CSS Houdini (`@property --n1 { syntax: "<integer>" }` + `@keyframes c1 { from { --n1:0 } to { --n1:12 } }`). Это невозможно в Emotion — `@property` не поддерживается.

### Решение
Реализовали counter через JavaScript:
- **`useCountUp` hook** — `requestAnimationFrame` + easing `easeOutQuart`
- **`AnimatedHero` component** — парсит первое целое число из строки значения (`parseHeroInt`), считает от 0 до target
- Длительность масштабируется: `Math.min(1200, 700 + target * 30)` — маленькие числа быстрее, большие медленнее
- Задержка 250ms для синхронизации с card entry анимацией

```tsx
function useCountUp(target: number, duration: number, delay: number): number {
  // requestAnimationFrame + easeOutQuart
}

function AnimatedHero({ value }: { value: string }): JSX.Element {
  // парсит "12,4 млрд" → prefix="", num=12, suffix=",4 млрд"
  // считает 0 → 12 с easing
}
```

### Урок
CSS Houdini (`@property`) — мощный, но не работает в CSS-in-JS. Для counter-анимаций в React используй `requestAnimationFrame`.

---

## Проблема 4: Storybook не запускается

### На Windows
- **esbuild platform mismatch**: `node_modules` содержал `@esbuild/linux-x64` (установлен в Docker), Windows требует `@esbuild/win32-x64`
- **zstd missing**: нативная зависимость не собралась
- **shell script syntax errors**: Git Bash не совместим с некоторыми скриптами Storybook

### В Docker-контейнере
- Обратная проблема: после `npm install @esbuild/win32-x64` на Windows, контейнер не находит `@esbuild/linux-x64`
- Решили: `npm install @esbuild/linux-x64 --no-save` внутри контейнера

### Урок
Нельзя шарить `node_modules` между Windows и Linux (Docker). Нативные зависимости (esbuild, zstd) привязаны к платформе.

---

## Проблема 5: Хардкод повторяющихся значений

### Симптом
`cubic-bezier(0.4, 0, 0.2, 1)` повторялся **12 раз** в `styles.ts`. Hover rgba значения для pill дублировались.

### Решение
Вынесли в TypeScript-константы (не CSS `var()` — Stylis ломает `var()` в animation properties):

```ts
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const HOVER_UP = 'rgba(22, 163, 74, 0.15)';
const HOVER_DN = 'rgba(220, 38, 38, 0.15)';
const HOVER_WN = 'rgba(204, 182, 4, 0.15)';
```

Все 12 вхождений easing заменены на `${EASE}`, hover rgba — на `HOVER_UP/DN/WN`.

### Урок
В Emotion styled-components дизайн-токены лучше хранить как TS-константы с интерполяцией `${}`, а не как CSS custom properties — Stylis может некорректно обрабатывать `var()` в некоторых свойствах (animation, transition).

---

## Проблема 6 (потенциальная): Stylis и CSS var()

### Контекст
Emotion использует Stylis как CSS-препроцессор. Stylis корректно обрабатывает `var()` в большинстве свойств, но есть edge cases:
- `animation-timing-function: var(--ease)` — может не работать
- `@keyframes` внутри styled — не хойстятся
- `@property` — не поддерживается

### Подход
Все timing functions и easing — через TS-константы с `${}` интерполяцией. CSS custom properties используются только для цветов и размеров (где Stylis надёжно их обрабатывает).

---

## Итоговая архитектура

```
styles.ts
├── TS constants: EASE, HOVER_UP/DN/WN (интерполяция в template literals)
├── CSS custom properties: цвета, шрифты, размеры (через var())
├── KEYFRAMES_CSS: строка с @keyframes (инжектится через <style>)
└── styled components: используют ${EASE}, var(--color), animation-name: kpi-*

KpiCard.tsx
├── <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
├── useCountUp hook (requestAnimationFrame + easeOutQuart)
├── AnimatedHero component (парсит число, считает от 0)
└── Toggle через inline style на DataLayer (translateX + opacity)
```

## Файлы

| Файл | Роль |
|---|---|
| `src/styles.ts` | Styled components, CSS tokens, keyframes string, TS constants |
| `src/KpiCard.tsx` | React component, counter animation, toggle logic |
| `src/types.ts` | TypeScript типы (не менялся) |
| `src/KpiCard.stories.tsx` | Storybook stories (не менялся) |
