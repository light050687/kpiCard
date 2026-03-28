# Чек-лист: Production Readiness для Superset визуализаций

## Статус KPI Card: ✅ ВСЁ ЗАКОММИЧЕНО И ЗАПУШЕНО (eed90ab)

---

## 1. Код и сборка

- [ ] **Билд без ошибок** — `npm run build` → 0 errors
- [ ] **Тесты проходят** — `npx jest` → все зелёные
- [ ] **Нет console.log/warn** — только console.error в ErrorBoundary
- [ ] **Нет TODO/FIXME/HACK** — grep по всем файлам
- [ ] **Нет hardcoded URLs** — localhost, 127.0.0.1, тестовые домены
- [ ] **Нет секретов** — API keys, пароли, токены
- [ ] **Нет unused imports** — TS strict ловит это
- [ ] **Минимум `as any`** — каждый с комментарием обоснования
- [ ] **Нет empty catch blocks** — все ошибки обрабатываются

## 2. 6 обязательных DataState (Design System v2.0)

- [ ] **Loading** — skeleton pulse animation при загрузке
- [ ] **Error** — красная иконка + сообщение + (опционально) кнопка "Повторить"
- [ ] **Empty** — иконка + "Нет данных за выбранный период"
- [ ] **Partial** — бейдж "Частичные данные" (dual mode, одна мера пуста)
- [ ] **Stale** — RefreshBar (2px анимированная полоска) при обновлении
- [ ] **Populated** — полноценный рендер с данными

## 3. React надёжность

- [ ] **ErrorBoundary** — ловит render crashes, показывает fallback UI
- [ ] **React.memo** — custom comparison предотвращает ререндеры
- [ ] **Cleanup в useEffect** — AbortController, removeEventListener, clearTimeout
- [ ] **No memory leaks** — все подписки отменяются при unmount
- [ ] **Key props** — уникальные key в списках

## 4. Superset интеграция

- [ ] **buildQuery.ts** — валидный SQL для любого datasource
- [ ] **transformProps.ts** — camelCase ключи formData (adhocFilters, timeRange, granularitySqla)
- [ ] **controlPanel.tsx** — все контролы с label, description, visibility
- [ ] **validators** — обязательные поля отмечены
- [ ] **renderTrigger** — мгновенные визуальные изменения vs query-зависимые
- [ ] **peerDependencies** — @superset-ui/core, react, @emotion/react
- [ ] **file: protocol** — установка через file:, не npm link
- [ ] **adhoc_filters** → filters передаются в дочерние запросы
- [ ] **time_range** → передаётся в дочерние запросы
- [ ] **Тёмная тема** — isDarkMode, CSS variables

## 5. Детализация (если есть модаль/drill-down)

- [ ] **Серверная агрегация** — GROUP BY на сервере, не клиенте
- [ ] **Пагинация** — нумерованные страницы + поле ввода номера
- [ ] **Сортировка** — клик по заголовку → серверная сортировка
- [ ] **Поиск** — debounce 300ms, точный + нечёткий режимы
- [ ] **Фильтрация нулей** — HAVING clause (опционально)
- [ ] **Expand/collapse** — lazy load children при раскрытии
- [ ] **Export CSV** — диалог "Сохранить как" (showSaveFilePicker)
- [ ] **Focus trap** — Tab не выходит за модаль
- [ ] **Escape** — закрывает модаль
- [ ] **Stale-while-revalidate** — старые данные видны при загрузке новых

## 6. Accessibility (WCAG 2.2 AA)

- [ ] **role="figure"** на корневом контейнере
- [ ] **aria-label** — на всех состояниях (загрузка, ошибка, данные)
- [ ] **aria-busy** — при loading state
- [ ] **Keyboard navigation** — все интерактивные элементы доступны с клавиатуры
- [ ] **Focus visible** — видимый outline при фокусе
- [ ] **Label-input** — htmlFor/id связь на полях ввода
- [ ] **Semantic HTML** — button, nav, main вместо div

## 7. Стилизация (Design System v2.0)

- [ ] **ТОЛЬКО Emotion CSS-in-JS** — styled, css prop. Никаких .css файлов
- [ ] **useTheme()** для цветов — никогда не хардкодить
- [ ] **Шрифты** — Manrope (--f) текст, JetBrains Mono (--m) числа
- [ ] **Grid** — 8px базовый юнит
- [ ] **Радиусы** — карточки 10px, контролы 6px
- [ ] **tabular-nums** — ВСЕГДА для чисел
- [ ] **Формат РФ** — пробел-тысячи, запятая-десятичные (1 234,56)
- [ ] **Валюта** — символ ПОСЛЕ числа (1 234 ₽)

## 8. Mock/Design mode (если реализован)

- [ ] **Пресеты** — реалистичные данные для каждого типа KPI
- [ ] **Бейдж ТЕСТ** — видимый индикатор mock mode
- [ ] **Детализация** — mock generator с пагинацией/сортировкой
- [ ] **Выключение** — переход на реальные данные без сброса настроек
- [ ] **buildQuery** — COUNT(*) dummy query (не SELECT 1)

## 9. Производительность

- [ ] **Нет row_limit: 50000** — серверная агрегация, не клиентская
- [ ] **Batch операции** — не row-by-row
- [ ] **Debounce** — поиск, resize, scroll
- [ ] **Lazy loading** — детализация загружается по требованию
- [ ] **Bundle size** — без лишних зависимостей

## 10. Документация

- [ ] **CLAUDE.md** — актуальные правила проекта
- [ ] **Conventional commits** — feat:, fix:, refactor:, test:
- [ ] **Нет node_modules, dist, __pycache__ в коммитах**
- [ ] **Нет секретов в истории git**

---

## Как использовать

Перед каждым релизом:
1. Пройти все пункты чек-листа
2. Записать результат (✅/❌) напротив каждого
3. Все ❌ исправить до деплоя
4. Финальный `npx jest` + `npm run build` → всё зелёное
5. Коммит + пуш + Docker build + deploy
