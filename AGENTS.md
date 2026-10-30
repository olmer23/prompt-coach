# Prompt Coach — навигатор по репозиторию

Читай этот файл первым. Он задаёт маршрут: какие файлы нужны для задачи, а какие трогать нельзя.
Не изучай репозиторий целиком. Сначала найди задачу в §4, затем открой только её файлы.

## 1. Назначение

Prompt Coach — тренажёр и плагин для OpenCode: оценивает промпт по шкале 0–100, показывает
пропуски, подбирает модель, считает токены и собирает улучшенный промпт.

| Часть | Что это | Как проверяется |
|---|---|---|
| `trainer.html`, `index.html`, `opencode-guide.html` | Статические страницы для GitHub Pages, без сборки | Открыть в браузере |
| `plugin/` | Исходники плагина: сервер, TUI, Desktop GUI, чистое ядро анализа | `npm test`, `npm run typecheck` |
| `installer/` | Установщик для Windows и упакованный снимок плагина | Синтаксис + ручная установка |

Источник истины: `plugin/`, HTML в корне и скрипты `installer/`.
Копии и артефакты: `installer/payload/`, `.opencode/plugins/`, `plugin/dist/`, `*.zip`.

## 2. Карта

```
.
├─ AGENTS.md                  этот навигатор
├─ README.md                  пользовательская документация, быстрый старт
├─ index.html                 стартовая страница GitHub Pages
├─ trainer.html               автономный тренажёр; внутри JS-порт ядра анализа
├─ opencode-guide.html        гайд по OpenCode
├─ opencode.json              конфиг OpenCode (схема)
├─ plugin/
│  ├─ AGENTS.md               детальная карта: задача → файл → символ
│  ├─ src/index.ts            сервер: agent tools, prompt hook, /coach
│  ├─ src/tui.tsx             TUI: панель, live bar, /coach
│  ├─ src/gui.tsx             Desktop: pill, панель, команда
│  ├─ src/core/analyzer.ts    конвейер analyze()
│  ├─ src/core/rules/*.ts     правила по 6 категориям
│  ├─ src/core/rules/index.ts регистрация правил
│  ├─ src/core/scoring.ts     сложность промпта
│  ├─ src/core/models.ts      каталог моделей, цены, подбор
│  ├─ src/core/rewrite.ts     улучшение промпта и советы по токенам
│  ├─ src/core/tokens.ts      оценка токенов
│  ├─ src/core/task.ts        определение типа задачи
│  ├─ src/core/usage.ts       лимиты OpenCode Go и бюджеты
│  ├─ src/core/i18n.ts        все тексты ru/en
│  ├─ src/core/types.ts       типы, веса, форма Analysis
│  ├─ dist/                   собранный GUI (генерируется)
│  ├─ docs/                   ARCHITECTURE, RULES, CONFIG, USAGE, GUIDE, CHEATSHEET
│  └─ tests/analyzer.test.ts  тесты ядра
├─ installer/
│  ├─ install.cmd             точка входа для Windows
│  ├─ install.ps1             логика установки
│  ├─ merge-config.mjs        аккуратная правка opencode.jsonc
│  └─ payload/                снимок plugin/ для установки (не источник)
└─ prompt-coach-installer.zip готовый архив (артефакт)
```

## 3. Зоны ответственности

| Зона | Отвечает за | Нельзя |
|---|---|---|
| `plugin/src/core/` | Анализ, правила, модели, тексты, токены | Импортировать OpenCode API; ломать форму `Analysis` |
| `plugin/src/index.ts` | Tools, prompt hook, slash-команда | Дублировать логику анализа |
| `plugin/src/tui.tsx` | Терминальный интерфейс | Трогать Desktop-код |
| `plugin/src/gui.tsx` | OpenCode Desktop | Забывать `npm run build:gui` |
| `plugin/dist/` | Собранный GUI-бандл | Править вручную |
| `plugin/docs/`, `README.md` | Документация | Описывать несуществующее поведение |
| `trainer.html` | Автономный тренажёр | Расходиться с ядром без причины |
| `installer/` | Установка на Windows | Дублировать логику плагина |
| `installer/payload/` | Снимок `plugin/` | Править как источник |
| `.opencode/` | Локальная копия (gitignored) | Коммитить или считать источником |

## 4. Маршруты задач

| Задача | Читать | Менять | Проверка |
|---|---|---|---|
| Оценка, правило, категория | `plugin/AGENTS.md`, `core/rules/<категория>.ts`, `core/rules/index.ts`, `core/types.ts`, `core/i18n.ts`, `tests/analyzer.test.ts` | Конкретное правило, регистрацию, тексты, тест | `cd plugin; npm test` |
| Новое правило | `plugin/docs/RULES.md`, `core/rules/index.ts`, `core/types.ts`, `core/i18n.ts` | Новый файл правила + регистрация + тексты + тест | `cd plugin; npm test` |
| Модели, цены, подбор | `plugin/AGENTS.md`, `core/models.ts`, `core/types.ts`, `tests/analyzer.test.ts` | `MODEL_CATALOG`, `pick*`, при необходимости тест | `cd plugin; npm test` |
| Тип задачи | `core/task.ts`, `core/types.ts`, `core/i18n.ts`, `core/analyzer.ts`, `tests/analyzer.test.ts` | Сигналы, приоритеты, тексты | `cd plugin; npm test` |
| Тексты и локализация | `core/i18n.ts`, `core/types.ts`, `trainer.html` (если текст есть там) | Только строки ru/en | `cd plugin; npm test` |
| Desktop GUI | `src/gui.tsx`, `core/types.ts`, нужная функция ядра | `gui.tsx` | `cd plugin; npm run typecheck; npm run build:gui` |
| TUI | `src/tui.tsx`, `core/types.ts`, нужная функция ядра | `tui.tsx` | `cd plugin; npm run typecheck; npm test` |
| Сервер, tools, команды | `src/index.ts`, `core/analyzer.ts`, `core/types.ts` | `index.ts` | `cd plugin; npm run typecheck; npm test` |
| Токены и лимиты | `core/tokens.ts` или `core/usage.ts`, `core/types.ts` | Соответствующий модуль | `cd plugin; npm test` |
| Установщик | `installer/install.ps1`, `merge-config.mjs`, `install.cmd` | Только установщик | Синтаксис + ручная установка |
| Тренажёр | `trainer.html` (секция `Core`), при изменении правил — `plugin/src/core/` | JS-порт в `trainer.html` | Открыть страницу в браузере |
| Страницы и гайд | Целевой HTML, `README.md` | Только целевой файл | Открыть в браузере |
| Упаковка и релиз | `plugin/`, `installer/`, `README.md` | Сборка GUI, синхронизация `payload/`, архив | Полный набор проверок |

## 5. Не трогать без необходимости

- `node_modules/` — зависимости, не исходники.
- `package-lock.json` — только если задача про зависимости.
- `plugin/dist/gui-experimental.cjs` — генерируется командой `npm run build:gui`.
- `installer/payload/` — снимок; синхронизировать только при задаче про установку или релиз.
- `.opencode/` — локальная развёрнутая копия, gitignored.
- `prompt-coach-installer.zip` — артефакт, не редактировать вручную.
- `LICENSE`, `.nojekyll`, `.gitattributes` — не относятся к задачам.
- Чужие незакоммиченные изменения — не откатывать и не переформатировать.

## 6. Экономия контекста

1. До первой правки открывай только файлы маршрута; обычно это 3–5 файлов. Не добавляй файлы сверх маршрута.
2. Ищи символ через поиск по тексту, читай только нужный фрагмент, не весь файл.
3. Не читай `package-lock.json`, `dist/`, `node_modules/`, `payload/`, архивы.
4. Не перечитывай и не пересказывай файлы, которые уже в контексте.
5. Не запускай проверки, которых нет в маршруте; для документации проверок нет.
6. Не делай рефакторинг, переименования и форматирование соседнего кода.
7. Меняй один клиент (Desktop или TUI), если задача не требует обоих.
8. Не синхронизируй копии, если задача не про установку или релиз.
9. Не создавай новые документы, если можно обновить существующий.
10. Не ищи в интернете, пока не проверены `README.md` и `plugin/docs/`.

## 7. Если задача неясна

1. Определи часть проекта по словам: Desktop, TUI, установщик, тренажёр, гайд.
2. Если подходят две части — задай один вопрос с вариантами, не читай весь репозиторий.
3. До ответа не редактируй файлы; можно только прочитать `README.md` и этот файл.
4. Перед правкой назови план из 1–3 пунктов и список файлов.
5. Если для задачи нужно больше 5 файлов сверх маршрута — остановись и подтверди объём.
6. После правки отчитайся: что изменено, что проверено, что не трогал.

## 8. Проверки

| Что | Команда |
|---|---|
| Тесты ядра | `cd plugin; npm test` |
| Типы | `cd plugin; npm run typecheck` |
| GUI-бандл | `cd plugin; npm run build:gui` |
| Синтаксис установщика | `node --check installer/merge-config.mjs` |
| HTML | Открыть файл в браузере, проверить консоль |

Готово только если: изменения минимальны, проверки из маршрута пройдены, копии и артефакты
не изменены без необходимости.
