# دمو UI + API — لاگین و مخاطبین (Vercel رایگان)

مرورگر **فقط** با `/api/login` و `/api/contacts` حرف می‌زند.  
کلید Supabase فقط در **Environment Variables** سرور است.

## استقرار روی Vercel

1. این پوشه را به یک ریپوی GitHub بفرستید (یا از Vercel CLI):
   ```bash
   cd vercel-contacts-api
   npx vercel
   ```
2. در Vercel → Project → **Settings → Environment Variables**:

| نام | مقدار |
|-----|--------|
| `SUPABASE_URL` | آدرس پروژه مثلاً `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | کلید **service_role** از Settings → API (ترجیحی) |
| `SESSION_SECRET` | یک رشته تصادفی بلند |

> اگر service_role ندارید موقتاً همان anon key را در `SUPABASE_SERVICE_ROLE_KEY` بگذارید (امنیت کمتر).

3. جدول `contacts` و `app_users` / `user_profile` باید از قبل با `schema.sql` برنامه اصلی ساخته شده باشد.
4. Deploy کنید و آدرس سایت را باز کنید.
5. ورود پیش‌فرض: `admin` / `admin` (اگر در دیتابیس همان hash باشد).

## تست محلی (اختیاری)

```bash
npm install
# نصب Vercel CLI
npx vercel dev
```

متغیرهای `.env` را مطابق `.env.example` بسازید.

## امنیت این دمو

- کلید دیتابیس در مرورگر نیست.
- بعد از لاگین، توکن امضاشده (HMAC) صادر می‌شود.
- API مخاطبین بدون `Authorization: Bearer ...` جواب نمی‌دهد.
- برای تولید واقعی: RLS per-user + محدودیت نقش را اضافه کنید.
