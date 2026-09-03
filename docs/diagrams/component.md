# C4 Level 3 — Component

Диаграмма раскрывает внутренние компоненты Fastify Backend, направление вызовов и применение Dependency Inversion между application-логикой и внешними API.

```mermaid
flowchart TB
    subgraph backend["Fastify Backend — Node.js 22, TypeScript, Fastify"]
        direction TB

        subgraph composition["Composition Root"]
            direction TB
            server["server.ts<br/>Создаёт Fastify и вызывает listen"]
            production["createProductionApp<br/>Создаёт production-адаптеры и читает конфигурацию"]
            builder["buildApp<br/>Создаёт сценарии и регистрирует маршруты"]
        end

        subgraph http["HTTP adapters"]
            direction TB
            basicRoutes["Root и Health routes<br/>GET / и GET /health"]
            currencyRoute["CurrencyRateRoute<br/>GET /rates/:currency"]
            webhookRoute["TelegramWebhookRoute<br/>POST /telegram/webhook"]
        end

        subgraph application["Прикладные сценарии"]
            direction TB
            handle["HandleBotMessage<br/>Формирует ответ пользователю"]
            process["ProcessCurrencyMessage<br/>Извлекает код и запускает получение курса"]
            getRate["GetCurrencyRate<br/>Нормализует код и применяет правило USD/USD"]
        end

        subgraph domain["Domain"]
            direction TB
            extract["extractCurrencyCode<br/>Доменный сервис"]
            currencyPort["CurrencyRateProvider<br/>Порт"]
            senderPort["BotMessageSender<br/>Порт"]
            unsupported["UnsupportedCurrencyError<br/>Доменная ошибка"]
        end

        subgraph outbound["Исходящие адаптеры"]
            direction TB
            frankfurterAdapter["FrankfurterCurrencyRateProvider<br/>Реализация CurrencyRateProvider"]
            telegramAdapter["TelegramBotApiMessageSender<br/>Реализация BotMessageSender"]
        end

        server -->|"FastifyInstance и сборка приложения"| production
        production -->|"production-зависимости и конфигурация"| builder
        production -->|"создаёт реализацию порта"| frankfurterAdapter
        production -->|"создаёт реализацию порта"| telegramAdapter

        builder -->|"регистрирует HTTP-маршруты"| basicRoutes
        builder -->|"регистрирует и внедряет GetCurrencyRate"| currencyRoute
        builder -->|"регистрирует и внедряет HandleBotMessage"| webhookRoute
        builder -->|"создаёт и связывает"| handle
        builder -->|"создаёт и связывает"| process
        builder -->|"создаёт и связывает"| getRate

        webhookRoute -->|"вызов execute: сообщение из webhook"| handle
        currencyRoute -->|"вызов execute: запрос курса"| getRate
        handle -->|"обработка текста"| process
        process -->|"извлечение кода валюты"| extract
        process -->|"получение курса"| getRate
        getRate -->|"запрос курса через port"| currencyPort
        handle -->|"отправка ответа через port"| senderPort
        handle -->|"обработка неподдерживаемого кода"| unsupported

        frankfurterAdapter -.->|"реализует"| currencyPort
        telegramAdapter -.->|"реализует"| senderPort
        frankfurterAdapter -->|"создаёт при неподдерживаемой валюте"| unsupported
    end

    frankfurterApi["Frankfurter API<br/>Внешняя система"]
    telegramApi["Telegram Bot API<br/>Внешняя система"]

    telegramApi -->|"webhook Update, HTTPS/JSON"| webhookRoute
    frankfurterAdapter -->|"запрос курса, HTTPS/JSON"| frankfurterApi
    telegramAdapter -->|"Telegram sendMessage, HTTPS/JSON"| telegramApi

    classDef compositionStyle fill:#d9edf7,stroke:#31708f,color:#222;
    classDef adapterStyle fill:#e8f5e9,stroke:#3c763d,color:#222;
    classDef applicationStyle fill:#fff3cd,stroke:#8a6d3b,color:#222;
    classDef domainStyle fill:#f3e5f5,stroke:#6a1b9a,color:#222;
    classDef externalStyle fill:#eeeeee,stroke:#666666,color:#222;
    class server,production,builder compositionStyle;
    class basicRoutes,currencyRoute,webhookRoute,frankfurterAdapter,telegramAdapter adapterStyle;
    class handle,process,getRate applicationStyle;
    class extract,currencyPort,senderPort,unsupported domainStyle;
    class frankfurterApi,telegramApi externalStyle;
```

Прикладные сценарии обращаются к `CurrencyRateProvider` и `BotMessageSender`, а не к Frankfurter или Telegram напрямую. Конкретные исходящие адаптеры реализуют эти порты и связываются со сценариями только в Composition Root; так диаграмма отражает Dependency Inversion и сохраняет независимость бизнес-логики от Fastify и внешних API.
