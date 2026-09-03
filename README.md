# Currency Telegram Bot

Telegram-бот на Fastify и TypeScript, который находит код валюты во входящем сообщении и показывает её курс относительно USD через Frankfurter API.

- [Telegram-бот](https://t.me/krekotun_currency_bot)
- [Production API](https://currency-telegram-bot-gamma.vercel.app)
- [C4-диаграммы](./docs/diagrams/README.md)

## Возможности

- Поиск трёхбуквенного кода валюты в тексте.
- Регистронезависимый ввод.
- Получение курса валюты относительно USD.
- Локальная обработка USD/USD как курса 1 без обращения к внешнему API.
- Понятное сообщение для неподдерживаемой валюты.
- Команды `/start` и `/help`.
- Приём Telegram webhook.
- Защита webhook секретным заголовком.
- Диагностические HTTP endpoints.
- Валидация внешних ответов.
- Автоматические тесты.

## Пример работы

Пользователь:

```text
Какой сейчас курс EUR?
```

Бот:

```text
1 EUR = 1.1615 USD
Курс на 2026-09-03
```

Значение и дата курса изменяются в зависимости от данных Frankfurter.

Другие варианты:

```text
USD → 1 USD = 1 USD
ZZZ → Код валюты ZZZ не поддерживается. Пример: EUR, GBP или JPY.
```

## Поддерживаемые валюты

Бот поддерживает валюты, доступные во [Frankfurter API](https://api.frankfurter.dev/v1/currencies). `USD` также входит в список, но курс USD/USD обрабатывается локально и не требует внешнего запроса.

| Код | Валюта | Код | Валюта | Код | Валюта |
| --- | --- | --- | --- | --- | --- |
| `AUD` | Австралийский доллар | `BRL` | Бразильский реал | `CAD` | Канадский доллар |
| `CHF` | Швейцарский франк | `CNY` | Китайский юань | `CZK` | Чешская крона |
| `DKK` | Датская крона | `EUR` | Евро | `GBP` | Британский фунт |
| `HKD` | Гонконгский доллар | `HUF` | Венгерский форинт | `IDR` | Индонезийская рупия |
| `ILS` | Израильский новый шекель | `INR` | Индийская рупия | `ISK` | Исландская крона |
| `JPY` | Японская иена | `KRW` | Южнокорейская вона | `MXN` | Мексиканское песо |
| `MYR` | Малайзийский ринггит | `NOK` | Норвежская крона | `NZD` | Новозеландский доллар |
| `PHP` | Филиппинское песо | `PLN` | Польский злотый | `RON` | Румынский лей |
| `SEK` | Шведская крона | `SGD` | Сингапурский доллар | `THB` | Тайский бат |
| `TRY` | Турецкая лира | `USD` | Доллар США | `ZAR` | Южноафриканский рэнд |

Перечень может изменяться вместе с поддержкой Frankfurter; актуальный список доступен по ссылке выше.

## Технологии

- Node.js 22
- TypeScript
- Fastify
- Vitest
- Zod
- pnpm
- Vercel
- Telegram Bot API
- Frankfurter API

Точные версии зависимостей указаны в [`package.json`](./package.json).

## Архитектура

Проект следует принципам Clean Architecture:

- `domain` содержит правила, порты, сервисы и типизированные ошибки;
- `application` содержит use cases обработки сообщений и получения курса;
- `adapters` преобразуют входящие HTTP-запросы и взаимодействия с внешними API;
- `infrastructure` загружает конфигурацию и создаёт production-зависимости;
- composition root в `server.ts`, `create-production-app.ts` и `build-app.ts` связывает реализации с портами и регистрирует маршруты.

Dependency Inversion отделяет бизнес-логику от деталей инфраструктуры: `GetCurrencyRate` зависит от `CurrencyRateProvider`, а `HandleBotMessage` — от `BotMessageSender`. Слой `application` не знает о Fastify, Frankfurter и деталях HTTP API Telegram.

- [System Context](./docs/diagrams/context.md)
- [Container](./docs/diagrams/container.md)
- [Component](./docs/diagrams/component.md)

```text
src/
├── adapters/
│   ├── currency/             # FrankfurterCurrencyRateProvider
│   ├── http/routes/          # HTTP routes и Telegram webhook
│   └── telegram/             # TelegramBotApiMessageSender
├── application/
│   └── use-cases/            # GetCurrencyRate, ProcessCurrencyMessage, HandleBotMessage
├── domain/
│   ├── errors/               # UnsupportedCurrencyError
│   ├── ports/                # CurrencyRateProvider, BotMessageSender
│   └── services/             # extractCurrencyCode
├── infrastructure/
│   ├── config/               # Валидация environment variables
│   └── create-production-app.ts
├── build-app.ts              # Сборка use cases и регистрация маршрутов
└── server.ts                 # Production entry point
```

## Как проходит сообщение

1. Пользователь отправляет сообщение Telegram-боту.
2. Telegram отправляет `Update` на `POST /telegram/webhook`.
3. Webhook проверяет секретный заголовок.
4. `HandleBotMessage` обрабатывает команду или сообщение.
5. `ProcessCurrencyMessage` извлекает код валюты.
6. `GetCurrencyRate` применяет правила и вызывает `CurrencyRateProvider`.
7. `FrankfurterCurrencyRateProvider` запрашивает Frankfurter API.
8. `TelegramBotApiMessageSender` отправляет ответ пользователю.

Для USD/USD `GetCurrencyRate` сразу возвращает курс 1, поэтому Frankfurter API не вызывается.

## HTTP API

| Метод и маршрут | Назначение |
| --- | --- |
| `GET /` | Возвращает название приложения и его статус. |
| `GET /health` | Проверяет доступность процесса приложения. |
| `GET /rates/:currency` | Возвращает курс трёхбуквенного кода валюты относительно USD. |
| `POST /telegram/webhook` | Принимает `Update` от Telegram Bot API. |

Webhook предназначен для Telegram, а не для ручного пользовательского вызова. Он требует заголовок `X-Telegram-Bot-Api-Secret-Token`; запрос без корректного секрета возвращает `401 Unauthorized`.

Безопасные примеры для локально запущенного приложения:

```bash
curl --silent --show-error http://localhost:3000/health
curl --silent --show-error http://localhost:3000/rates/eur
```

## Локальный запуск

Требования:

- Node.js 22;
- pnpm версии, указанной в поле `packageManager` файла [`package.json`](./package.json) (`10.34.5`).

```bash
git clone https://github.com/SemenKr/currency-telegram-bot.git
cd currency-telegram-bot
pnpm install
cp .env.example .env
pnpm dev
```

Перед запуском укажите в `.env` собственный токен бота, полученный у BotFather, и самостоятельно созданный webhook secret. Не используйте значения из примера как production-секреты.

После запуска приложение доступно по адресу <http://localhost:3000>.

## Переменные окружения

| Переменная | Обязательность | Назначение |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Обязательная | Токен Telegram-бота, полученный у BotFather. |
| `TELEGRAM_WEBHOOK_SECRET` | Обязательная | Самостоятельно созданная случайная строка для проверки webhook-запросов Telegram. Допустимы 32–256 символов `A-Z`, `a-z`, `0-9`, `_` и `-`. |
| `PORT` | Необязательная | Порт HTTP-сервера; по умолчанию `3000`. |
| `HOST` | Необязательная | Адрес прослушивания; по умолчанию `0.0.0.0`. |

Файл `.env` не должен попадать в Git. Если токен был опубликован публично, его необходимо немедленно отозвать через BotFather и создать новый.

## Регистрация webhook

Загрузите собственные значения из локального `.env` в окружение текущей shell-сессии:

```bash
set -a
source .env
set +a
```

Зарегистрируйте production webhook:

```bash
curl --silent --show-error \
  --request POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --data-urlencode "url=https://currency-telegram-bot-gamma.vercel.app/telegram/webhook" \
  --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  --data-urlencode 'allowed_updates=["message"]'
```

Проверьте регистрацию:

```bash
curl --silent --show-error \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

Команды используют переменные окружения и не содержат фактический токен или webhook secret.

## Команды разработки

| Команда | Назначение |
| --- | --- |
| `pnpm dev` | Запускает `src/server.ts` в watch-режиме через tsx. |
| `pnpm build` | Компилирует production-сборку в `dist`. |
| `pnpm start` | Запускает собранный `dist/src/server.js`. |
| `pnpm typecheck` | Проверяет TypeScript без создания файлов. |
| `pnpm test` | Однократно запускает тесты Vitest. |
| `pnpm test:watch` | Запускает Vitest в watch-режиме. |

## Тесты

Тестами покрыты извлечение валютного кода, use cases, правило USD/USD, неизвестная валюта, Frankfurter adapter, Telegram sender, аутентификация и валидация webhook, environment configuration и HTTP routes. На текущем этапе выполняются 37 тестов; это число может меняться по мере развития проекта.

```bash
pnpm exec vitest run
```

## Deployment

Приложение развёрнуто на Vercel: <https://currency-telegram-bot-gamma.vercel.app>.

- Production environment должен содержать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_WEBHOOK_SECRET`.
- Версия Node.js закреплена на `22.x`.
- Push в ветку `main` запускает новый deployment.
- После изменения environment variables требуется redeploy.

## Ограничения

- Поддерживаются валюты, доступные Frankfurter.
- Используется последний доступный опубликованный курс.
- В выходные и праздники дата курса может отличаться от текущей даты.
- Приложение не является финансовой рекомендацией.
- Состояние и история запросов не сохраняются.

## Лицензия

ISC.
