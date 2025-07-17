# Fix Auth0 Localhost Callback URL Error

**Date**: January 2025  
**Issue**: "Callback URL mismatch" error on localhost:3000  
**Status**: ✅ Easy fix - just update Auth0 settings

## 🚨 Ошибка

```
SuperDuperAi, Corp
Oops!, something went wrong
Callback URL mismatch.
The provided redirect_uri is not in the list of allowed callback URLs.
Please go to the Application Settings page and make sure you are sending a valid callback url from your application.
```

## 🔧 Решение (5 минут)

### Шаг 1: Откройте Auth0 Dashboard

1. Перейдите на **[Auth0 Dashboard](https://manage.auth0.com/)**
2. Войдите в аккаунт (tenant: `life2film.uk.auth0.com`)

### Шаг 2: Найдите приложение

1. Нажмите **Applications** → **Applications** в левом меню
2. Найдите приложение с Client ID: `lWC7w2zUX3Czl93GBeaeMJFB6Cdk68h3`
3. Нажмите на название приложения

### Шаг 3: Обновите URLs

В разделе **Settings**, найдите следующие поля и добавьте localhost URLs:

#### ✅ Allowed Callback URLs

**Добавьте:**

```
http://localhost:3000/auth/callback
```

**Если есть production URL, добавьте через запятую:**

```
http://localhost:3000/auth/callback,
https://your-production-domain.com/auth/callback
```

#### ✅ Allowed Logout URLs

**Добавьте:**

```
http://localhost:3000
```

#### ✅ Allowed Web Origins

**Добавьте:**

```
http://localhost:3000
```

#### ✅ Allowed Origins (CORS)

**Добавьте:**

```
http://localhost:3000
```

### Шаг 4: Сохраните изменения

**⚠️ КРИТИЧЕСКИ ВАЖНО**: Прокрутите вниз и нажмите **"Save Changes"**

## 🧪 Проверьте работу

1. **Очистите кэш браузера:**

   - Chrome: `Ctrl+Shift+R`
   - Firefox: `Ctrl+F5`

2. **Перейдите на localhost:3000**

   - Должна произойти правильная переадресация на Auth0
   - После логина вернет на `http://localhost:3000/auth/callback`
   - Затем перенаправит в приложение

3. **Проверьте логи:**
   ```
   🔧 Using Auth0 base URL: http://localhost:3000
   ✅ Auth0 session established successfully
   ```

## 🎯 Ожидаемое поведение после исправления

```
localhost:3000 → Auth0 login → Successful callback → Application dashboard
```

## 📋 Текущие настройки Auth0

Для справки, ваши текущие настройки:

```typescript
// lib/auth0.ts
domain: "life2film.uk.auth0.com";
clientId: "lWC7w2zUX3Czl93GBeaeMJFB6Cdk68h3";
baseUrl: "http://localhost:3000";
callbackUrl: "http://localhost:3000/auth/callback";
```

## 🚧 Альтернативное решение (НЕ рекомендуется)

Если по какой-то причине нет доступа к Auth0 Dashboard, можно временно добавить в `.env.local`:

```bash
# Temporary workaround - NOT recommended for production
AUTH0_USE_PRODUCTION_CALLBACK=true
```

**⚠️ Но лучше исправить настройки Auth0 правильно!**

## ✅ После исправления

Система будет работать как планировалось:

- ✅ Пользователи входят через Auth0
- ✅ Подключают свои аккаунты SuperDuperAI
- ✅ Используют персональные кредиты для генерации
- ✅ Прозрачная интеграция без проблем с аутентификацией

---

**Время исправления**: ~5 минут  
**Сложность**: Очень легко  
**Требуется**: Доступ к Auth0 Dashboard
