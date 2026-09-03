# C4 Level 2 — Container

Диаграмма показывает единственный развёртываемый контейнер системы, его ответственность и взаимодействие с пользователями и внешними API.

```mermaid
flowchart LR
    user["Telegram User<br/>Пользователь бота"]
    reviewer["Разработчик или проверяющий<br/>Проверяет HTTP endpoints"]
    telegram["Telegram Bot API<br/>Внешняя система"]
    frankfurter["Frankfurter API<br/>Внешняя система курсов"]

    subgraph system["Currency Telegram Bot"]
        backend["Fastify Backend<br/>Node.js 22, TypeScript, Fastify<br/>Размещение: Vercel Function<br/><br/>Принимает Telegram webhook;<br/>предоставляет /, /health и /rates/:currency;<br/>выполняет бизнес-логику;<br/>вызывает внешние API"]
    end

    user -->|"сообщение через Telegram"| telegram
    telegram -->|"webhook Update, HTTPS/JSON"| backend
    backend -->|"Telegram sendMessage, HTTPS/JSON"| telegram
    telegram -->|"ответ бота через Telegram"| user
    backend -->|"запрос курса, HTTPS/JSON"| frankfurter
    reviewer -->|"GET /health или /rates/:currency, HTTPS/JSON"| backend

    classDef person fill:#fff3cd,stroke:#8a6d3b,color:#222;
    classDef container fill:#d9edf7,stroke:#31708f,color:#222;
    classDef external fill:#eeeeee,stroke:#666666,color:#222;
    class user,reviewer person;
    class backend container;
    class telegram,frankfurter external;
```

Fastify Backend является одним контейнером, потому что маршруты, прикладная и доменная логика, а также исходящие адаптеры выполняются в одном процессе и развёртываются вместе как одна Vercel Function. В проекте нет отдельных frontend-приложений, баз данных или независимо развёртываемых сервисов.
