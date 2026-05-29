# agro-iot-dashboard

`agro-iot-dashboard` — отдельный frontend-dashboard для IoT-модуля Smart.Agromelio.

Dashboard отображает данные метеостанций и почвенных датчиков, полученные через `agro-iot-service`, и подключается к основному frontend Smart.Agromelio как отдельный microfrontend через iframe.
Основной frontend не содержит IoT-логику: он только открывает страницу `/iot-dashboard` и передаёт dashboard авторизацию через `postMessage`.

## Запуск

Перед запуском должны быть подняты:

- `api-gateway`;
- `agro-iot-service`;
- PostgreSQL для IoT-сервиса.

## Локальный запуск

Установить зависимости:

```bash
npm install
```

Запустить dashboard:

```bash
npm run dev
```

Dashboard будет доступен по адресу:

```text
http://localhost:9002
```

Рекомендуемый способ проверки — открывать dashboard через основной frontend:

```text
http://localhost:9000/#/iot-dashboard
```

В этом режиме основной frontend автоматически передаёт JWT-токен в dashboard через `postMessage`.

## Docker-запуск

```bash
docker network create agronetwork
```

```bash
docker compose up -d --build
```

После запуска dashboard доступен по адресу:

```text
http://localhost:9002
```

## Переменные окружения

Пример `.env`:

```env
VITE_IOT_API_BASE_URL=/api/iot
# VITE_DEV_JWT=
# VITE_ALLOWED_PARENT_ORIGINS=http://localhost:9000,http://localhost:8080
VITE_BASE_PATH=/
```

Назначение переменных:

- `VITE_IOT_API_BASE_URL` — базовый путь к IoT API;
- `VITE_DEV_JWT` — необязательный dev-only токен для standalone-запуска;
- `VITE_ALLOWED_PARENT_ORIGINS` — список разрешённых origin для получения авторизации через `postMessage`.
- `VITE_BASE_PATH` — путь, под которым dashboard публикуется наружу (`/` локально, `/iot-dashboard/` в prod при same-origin размещении).

## Что отображает микросервис

- список метеостанций;
- последние данные станции;
- список почвенных датчиков;
- последние данные датчиков;
- графики истории измерений;
- настройка интервала опроса датчиков станцией в минутах при регистрации и на странице станции.

IoT-логика, запросы к `/api/iot`, обработка данных и визуализация находятся только внутри `agro-iot-dashboard`.
