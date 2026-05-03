# agro-iot-dashboard

`agro-iot-dashboard` — отдельный dashboard для IoT-модуля Smart.Agromelio. Dashboard визуализирует данные метеостанций и почвенных датчиков, полученные через отдельный `agro-iot-service`, и подключается к основному frontend Smart.Agromelio как самостоятельный microfrontend через iframe.

Основной frontend Smart.Agromelio не содержит IoT-логику. Он остаётся оболочкой: добавляет пункт меню, route `/iot-dashboard`, iframe host-страницу и передаёт dashboard текущую авторизацию пользователя.

## Архитектура

```text
Основной frontend Smart.Agromelio
        |
        | route /iot-dashboard
        | iframe + postMessage auth
        v
agro-iot-dashboard
        |
        | HTTP /api/iot/...
        v
api-gateway
        |
        | proxy /api/iot
        v
agro-iot-service
        |
        v
PostgreSQL / IoT TCP data
```
## Авторизация

Авторизация передаётся из основного frontend через `postMessage`.

При загрузке dashboard отправляет родительскому окну сообщение готовности:

```js
{ type: 'AGRO_IOT_READY' }
```

Основной frontend отвечает сообщением:

```js
{
  type: 'AGRO_IOT_AUTH',
  payload: {
    apiBase: 'http://localhost:8080',
    authorization: 'Bearer <jwt>',
    dark: false
  }
}
```

Dashboard хранит `authorization` только в памяти процесса браузера и подставляет его в Axios interceptor. Ручной ввод токена в интерфейсе отсутствует.

Для standalone/dev-запуска допускается временный fallback через переменную окружения `VITE_DEV_AUTH_TOKEN`, но он не используется в production-сценарии через основной frontend.

## Переменные окружения

Файл `.env.example`:

```env
# Standalone/dev fallback. В iframe-режиме apiBase и JWT приходят из основного frontend через postMessage.
VITE_API_BASE_URL=/api/iot
# VITE_DEV_AUTH_TOKEN=
# VITE_ALLOWED_PARENT_ORIGINS=http://localhost:9000,http://localhost:8080
```

Пояснение:

| Переменная | Назначение |
|---|---|
| `VITE_API_BASE_URL` | Базовый путь к IoT API для standalone/dev-запуска. По умолчанию `/api/iot`. |
| `VITE_DEV_AUTH_TOKEN` | Необязательный dev-only токен для запуска dashboard без основного frontend. |
| `VITE_ALLOWED_PARENT_ORIGINS` | Список разрешённых origin родительского окна для `postMessage`. |

## Используемый API

Dashboard использует фактический REST-контракт `agro-iot-service` под префиксом `/api/iot`.

### Dashboard

| Method | Path | Назначение |
|---|---|---|
| `GET` | `/dashboard` | Общий обзор: станции организации, online-статус, последние данные и датчики. |

### Станции

| Method | Path | Назначение |
|---|---|---|
| `POST` | `/stations` | Регистрация станции. |
| `GET` | `/stations` | Получение списка станций организации. |
| `GET` | `/stations/{field_id}` | Получение станции, привязанной к полю. |
| `PUT` | `/stations/{field_id}` | Обновление названия и координат станции. |
| `DELETE` | `/stations/{field_id}` | Удаление станции и связанных IoT-данных. |
| `GET` | `/fields/{field_id}/stations` | Список станций на поле для отображения на карте. |

### Данные метеостанции

| Method | Path | Назначение |
|---|---|---|
| `GET` | `/fields/{field_id}/data/last` | Последний пакет данных метеостанции. |
| `GET` | `/fields/{field_id}/data/history?date_from=...&date_to=...` | История пакетов за период. |
| `GET` | `/fields/{field_id}/data/summary?date_from=...&date_to=...` | Агрегаты `avg/min/max` по данным станции. |

### Данные почвенных датчиков

| Method | Path | Назначение |
|---|---|---|
| `GET` | `/fields/{field_id}/sensors` | Список `sensor_id`, найденных для станции на поле. |
| `GET` | `/fields/{field_id}/sensors/{sensor_id}/data/last` | Последний пакет данных датчика. |
| `GET` | `/fields/{field_id}/sensors/{sensor_id}/data/history?date_from=...&date_to=...` | История данных датчика за период. |
| `GET` | `/fields/{field_id}/sensors/{sensor_id}/data/summary?date_from=...&date_to=...` | Агрегаты `avg/min/max` по данным датчика. |

## Основные сущности

| Поле | Описание |
|---|---|
| `field_id` | UUID поля Smart.Agromelio. В текущем backend используется как основной REST-идентификатор станции. |
| `hardware_id` | Физический ID/серийный номер метеостанции. Используется при регистрации и при приёме TCP-пакетов от устройства. |
| `sensor_id` | Номер почвенного датчика внутри станции. |
| `payload` | JSON-объект с измерениями. |
| `last_seen_at` | Время последней активности станции. |

## Отображаемые показатели

Dashboard отображает данные из `payload`:

### Метеостанция

- `wind_speed` — скорость ветра;
- `wind_direction` — направление ветра;
- `rain` — осадки.

### Почвенные датчики

- `temperature` — температура;
- `soil_moisture` — влажность почвы.

Backend сохраняет значения из TCP-пакета как raw integer. Dashboard преобразует значения для отображения на UI по формулам аппаратного протокола, реализованным в `src/utils/formatMeasurements.js`.

## Структура проекта

```text
agro-iot-dashboard/
├── src/
│   ├── api/
│   │   ├── hostBridge.js          # postMessage-интеграция с основным frontend
│   │   ├── http.js                # Axios instance, auth interceptor, обработка ошибок
│   │   └── iotApi.js              # методы доступа к /api/iot
│   ├── components/
│   │   ├── StationCard.vue
│   │   ├── SensorCard.vue
│   │   ├── StationHistoryChart.vue
│   │   ├── SensorHistoryChart.vue
│   │   ├── MetricCard.vue
│   │   ├── SummaryCard.vue
│   │   └── PeriodSelector.vue
│   ├── pages/
│   │   ├── DashboardPage.vue      # общий обзор станций
│   │   ├── StationPage.vue        # детальная страница станции
│   │   └── RegisterStationPage.vue# регистрация станции
│   ├── router/
│   │   └── index.js
│   ├── utils/
│   │   ├── dates.js
│   │   ├── formatMeasurements.js
│   │   └── summary.js
│   ├── App.vue
│   └── main.js
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
└── vite.config.js
```

## Локальный запуск

Перед запуском должны быть подняты `api-gateway` и `agro-iot-service`.

```bash
npm install
npm run dev
```

Dashboard будет доступен по адресу:

```text
http://localhost:9002
```

В dev-режиме Vite proxy направляет `/api` на gateway:

```text
http://127.0.0.1:8080
```

Рекомендуемый сценарий проверки — открывать dashboard не напрямую, а через основной frontend:

```text
http://localhost:9000/#/iot-dashboard
```

Так dashboard автоматически получит JWT через `postMessage`.

## Docker-запуск

```bash
docker network create agronetwork

docker compose up -d --build
```

После запуска dashboard доступен на:

```text
http://localhost:9002
```

## Интеграция с основным frontend

В основном frontend Smart.Agromelio должны быть заданы переменные:

```env
VUE_APP_IOT_DASHBOARD_URL=http://localhost:9002
VUE_APP_IOT_API_BASE_URL=http://localhost:8080
```

Минимальная интеграция в основном frontend:

- route `/iot-dashboard`;
- host-страница `IotDashboardHostPage.vue`;
- пункт меню “Датчики”;
- iframe на `VUE_APP_IOT_DASHBOARD_URL`;
- передача JWT и `apiBase` через `postMessage`.

IoT-логика, запросы к `/api/iot`, графики и обработка данных остаются внутри `agro-iot-dashboard`.
Dashboard является самостоятельным microfrontend и не переписывает основной frontend Smart.Agromelio. Основной frontend используется только как оболочка для открытия IoT-dashboard и передачи авторизации.
