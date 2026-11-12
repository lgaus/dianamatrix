# Карта проекта — где что лежит

Справочник для агентов. Читать не целиком, а только строку нужной области. Открывать файл — только если он нужен для текущей задачи.

## Решения и задачи
| Что | Где | Когда читать |
|---|---|---|
| Решения пользователя по шагу, цели | GitHub issue шага: `gh api repos/lgaus/dianamatrix/issues/<N> --jq .body` | всегда — номер даёт координатор |
| Шаги, правила работы и кода | `PLAN.md`: «Правила работы», «Правила кода», раздел текущего шага | planner; остальным — только если правило не передано в брифе |
| Дизайн-значения (цвета, шрифты, токены, правило наведения) | `PLAN.md` → «Дизайн-значения» | при работе с вёрсткой |
| Порядок работы агентов | `CLAUDE.md` | координатор, planner |
| Решения пользователя по текущему шагу (раунды) | `stepN-decisions.md` в scratchpad сессии — путь даёт координатор | все агенты, перед работой |

## Код
| Область | Файлы |
|---|---|
| Токены темы (цвета, шрифты, размеры, тени, переломы) | `app/assets/css/theme.css`; точка входа CSS — `app/assets/css/main.css` |
| Тексты интерфейса | `app/content/texts.ts` (раздел по блоку: `header`, `form`, `matrix`, `healthMap`, `purpose`, `consultation`) |
| Расшифровки арканов | `app/content/arcana.ts` |
| Типы матрицы | `app/utils/matrix/types.ts` |
| Формулы (тестовые) | `app/utils/matrix/formulas.ts` |
| Дата рождения: маска, правка с клавиатуры, проверка, сетка календаря | `app/utils/date/birthDate.ts` |
| Чакры: id, цвет кольца, точки | `app/config/chakras.ts` |
| Классы отклика (hover / active / focus) | `app/config/feedback.ts` |
| Каркас: фон, контейнер, шапка над страницей | `app/app.vue` |
| Главная — только компоновка блоков | `app/pages/index.vue`; заготовка «Обо мне» — `app/pages/about.vue` |
| Шапка и меню | `app/components/AppHeader.vue`, `app/components/HeaderMenu.vue`, `app/composables/useHideOnScroll.ts` |
| Форма: наклейка, табы, поля | `CalculatorForm.vue` (компоновка, отправка), `StickerBadge.vue`, `FormTabs.vue`, `TextField.vue` (поле с ошибкой) |
| Схема матрицы | `MatrixChart.vue` (звезда, аура, зерно, подпись, `MATRIX_CHART_ID`), `MatrixNode.vue` (один круг); прокрутка к схеме после расчёта — в `CalculatorForm.vue` |
| Карта здоровья | `HealthMapCard.vue` (таблица чакр, данные через props, «–» без данных) |
| Предназначение | `PurposeCard.vue` (4 ячейки, данные через props, «–» без данных) |
| Шапка карточек («01»/«02», заголовок, подзаголовок) | `CardHeading.vue` — общая для карты здоровья и предназначения |
| Блок разбора | `ConsultationBlock.vue` |
| Окно контактов | `ContactDialog.vue` (в `app.vue`), состояние и открытие — `app/composables/useContactDialog.ts`, ники/номера и ссылки — `app/config/contacts.ts`; кнопки записи в `AppHeader.vue`, `HeaderMenu.vue`, `ConsultationBlock.vue` |
| Поле даты и календарь | `DateField.vue` (маска, открытие, положение и ширина календаря, автопрокрутка), `DatePicker.vue` (календарь), `CalendarSelect.vue` (селекты месяца/года), `app/composables/useRowWrap.ts` (перенос навигации) |
| Блоки страницы | `app/components/CalculatorForm.vue`, `MatrixChart.vue`, `HealthMapCard.vue`, `PurposeCard.vue`, `ConsultationBlock.vue` |
| Сборка, деплой | `nuxt.config.ts`, `.github/workflows/deploy.yml` (main → корень gh-pages, develop → /dev/) |

## Тесты (`tests/`)
Читать только тесты затронутой области. Структура и данные, без формулировок текстов (правило PLAN.md).
| Файл | Что проверяет |
|---|---|
| `theme.test.ts` | токены theme.css, импорты main.css |
| `texts.test.ts`, `arcana.test.ts` | структура текстов и арканов |
| `formulas.test.ts` | формулы на двух контрольных датах, chakras.ts |
| `feedback.test.ts` | классы отклика |
| `useHideOnScroll.test.ts` | скрытие шапки при прокрутке |
| `birthDate.test.ts`, `birthDateEdit.test.ts`, `birthDateKeyEdit.test.ts` | маска, правка, проверка даты |
| `components/CalculatorForm`, `DateField`, `DatePicker`, `CalendarSelect` `.test.ts` | форма, поле даты, календарь |
| `components/MatrixChart`, `MatrixNode` `.test.ts` | схема матрицы: числа, кольца, подпись, пустое состояние |
| `components/HealthMapCard.test.ts` | карта здоровья: структура таблицы, числа, «–» |
| `components/PurposeCard.test.ts` | предназначение: ячейки, числа, формулы, «–» |
| `components/ConsultationBlock`, `ContactDialog` `.test.ts` | блок разбора, окно контактов: открытие, закрытие, ссылки |
| `helpers/vueEvents.ts` | помощник для событий при замороженном времени (`vi.setSystemTime`) |
| `components/AppHeader`, `HeaderMenu`, `IndexPage` `.test.ts` | шапка, меню, порядок блоков главной |

## Макеты
- В облачной копии: `/mnt/user-data/uploads/dianamatrix/docs/mockups/` (PNG @2x: компьютер 2560×4400, телефон 780×5800). В репозитории их нет.
- Замеры, уже сделанные для шага, planner передаёт в брифе — заново не измерять.

## Окружение (облачная копия)
- Клон: `/home/claude/dianamatrix`. `bun`, Node 22, Playwright + Chromium предустановлены (в проект не ставить). `rsync` нет — для копий `cp`/`tar`.
- Временные файлы — в scratchpad сессии, не в проекте. Скрипты замеров в браузере — `scratchpad/pw/`, использовать готовые.
- Подключение к компьютеру пользователя (её папка `dianamatrix`) — только у координатора, для записи изменённых файлов без коммита.
- Команды проверки: `bun run test`, `bunx nuxi typecheck`, `NITRO_PRESET=github_pages NUXT_APP_BASE_URL=/dianamatrix/ bunx nuxi generate`.
