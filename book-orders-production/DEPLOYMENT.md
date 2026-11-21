# دليل النشر للإنتاج - Maqtabati

هذا الدليل يشرح كيفية نشر تطبيق Maqtabati كخدمة ويب (SaaS) جاهزة للاستخدام من قبل الزبائن.

---

## 📋 المتطلبات قبل النشر

1. **حساب GitHub** (لرفع الكود).
2. **قاعدة بيانات PostgreSQL** (مجانية للبداية):
   - **Supabase** (موصى به): https://supabase.com — 500MB مجاناً.
   - **Neon**: https://neon.tech — 512MB مجاناً.
   - **Railway**: https://railway.app — 5$ رصيد مجاني.
3. **منصة الاستضافة** (اختر واحدة):
   - **Vercel** (أسهل لـ Next.js): https://vercel.com
   - **Railway** (يدعم Docker + DB): https://railway.app
   - **Fly.io**: https://fly.io
   - **VPS خاص** (DigitalOcean, Hetzner, Contabo) + Docker.

---

## 🚀 الخيار الأول: النشر على Vercel (الأسهل والأسرع)

### 1. ارفع الكود إلى GitHub
```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit: Maqtabati SaaS ready"
git branch -M main
git remote add origin https://github.com/USERNAME/maqtabati.git
git push -u origin main
```

### 2. أنشئ قاعدة بيانات على Supabase
1. ادخل https://supabase.com → New Project.
2. اختر Region قريب (Europe West للشرق الأوسط).
3. سجل **Database Password** (ستحتاجه).
4. اذهب إلى **Settings → Database** → انسخ **Connection String** (URI):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

### 3. اربط المشروع بـ Vercel
1. ادخل https://vercel.com → Add New Project → Import Git Repository.
2. اختر مستودع `maqtabati`.
3. **Configure Project**:
   - Framework Preset: **Next.js** (يتعرف تلقائياً).
   - Root Directory: `./` (إذا كان الكود في الجذر).
4. **Environment Variables** (أضفها قبل Deploy):
   | Name | Value | Description |
   |------|-------|-------------|
   | `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres?pgbouncer=true` | رابط قاعدة البيانات (استخدم PgBouncer للـ Serverless) |
   | `DATABASE_PROVIDER` | `postgresql` | يخبر Prisma باستخدام PostgreSQL |
   | `JWT_SECRET` | `maqtati-change-this-in-production-2026` | مفتاح تشفير الجلسات |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` | رابط التطبيق بعد النشر |
5. اضغط **Deploy**.

### 4. تطبيق الترحيلات (Migrations) على قاعدة البيانات
بعد النشر الأول، ستحتاج لتطبيق الجداول:
1. في Vercel Dashboard → Project → **Functions** → تأكد أن `prisma migrate deploy` يعمل.
   أو شغل محلياً واربط قاعدة البيانات الإنتاجية:
   ```bash
   # محلياً
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```
2. زرع البيانات الأولية (المفاتيح التجريبية):
   ```bash
   DATABASE_URL="postgresql://..." npm run db:seed:licenses
   ```

### 5. جاهز!
تطبيقك الآن يعمل على: `https://your-app.vercel.app`

---

## 🐳 الخيار الثاني: النشر باستخدام Docker (على VPS أو Railway/Fly.io)

### 1. على Railway (أسهل مع Docker + DB مجانية)
1. أنشئ مشروع جديد على Railway → **Deploy from GitHub**.
2. أضف **PostgreSQL** من متجر الإضافات (Add PostgreSQL).
3. في متغيرات البيئة (Variables)، أضف:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DATABASE_PROVIDER=postgresql
   JWT_SECRET=maqtati-change-this-in-production-2026
   NEXTAUTH_URL=https://your-app.railway.app
   ```
4. Railway سيكتشف `Dockerfile` تلقائياً ويبني الصورة.
5. بعد النشر، شغل الترحيلات من **Railway Shell**:
   ```bash
   npx prisma migrate deploy
   npm run db:seed:licenses
   ```

### 2. على VPS خاص (Ubuntu 22.04/24.04)
```bash
# 1. ثبت Docker
curl -fsSL https://get.docker.com | sh

# 2. ثبت Docker Compose
apt install docker-compose-plugin

# 3. استنسخ المشروع
git clone https://github.com/USERNAME/maqtabati.git
cd maqtabati

# 4. أنشئ ملف .env للإنتاج
cat > .env <<EOF
DATABASE_URL="postgresql://user:pass@localhost:5432/maqtabati"
DATABASE_PROVIDER=postgresql
JWT_SECRET="كلمة_سر_قوية_عشوائية_طويلة"
NEXTAUTH_URL="https://your-domain.com"
EOF

# 5. أنشئ docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: maqtabati
      POSTGRES_USER: maqtabati
      POSTGRES_PASSWORD: "كلمة_سر_قوية_لقاعدة_البيانات"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://maqtabati:كلمة_سر_قوية_لقاعدة_البيانات@db:5432/maqtabati"
      DATABASE_PROVIDER: "postgresql"
      JWT_SECRET: "كلمة_سر_قوية_عشوائية_طويلة"
      NEXTAUTH_URL: "https://your-domain.com"
    depends_on:
      - db
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# 6. شغل التطبيق
docker compose up -d --build

# 7. طبق الترحيلات
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed:licenses
```

---

## 🔧 متغيرات البيئة المطلوبة للإنتاج

| المتغير | مطلوب؟ | مثال | ملاحظات |
|-----------|--------|------|---------|
| `DATABASE_URL` | ✅ نعم | `postgresql://user:pass@host:5432/db?pgbouncer=true` | استخدم `pgbouncer=true` لـ Serverless (Vercel) |
| `DATABASE_PROVIDER` | ✅ نعم | `postgresql` | أو `sqlite` للتطوير المحلي فقط |
| `JWT_SECRET` | ✅ نعم | `random_string_64_chars` | غيّره في الإنتاج! استخدم `openssl rand -hex 32` |
| `NEXTAUTH_URL` | ✅ نعم | `https://app.yourdomain.com` | رابط التطبيق النهائي |
| `NODE_ENV` | لا | `production` | يُضبط تلقائياً في Docker/Vercel |

---

## 🔄 تحديثات مستقبلية (CI/CD)

### GitHub Actions للنشر التلقائي
أنشئ `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DATABASE_PROVIDER: postgresql

      # للنشر على Vercel
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ✅ قائمة تحقق قبل الإطلاق (Go-Live Checklist)

- [ ] `DATABASE_URL` يشير لقاعدة بيانات **إنتاج** (وليس محلية).
- [ ] `DATABASE_PROVIDER=postgresql` مضبوط.
- [ ] `JWT_SECRET` **تم تغييره** لقيمة عشوائية قوية (32 بايت).
- [ ] `NEXTAUTH_URL` يطابق رابط الإنتاج بدقة (مع https).
- [ ] الترحيلات مطبقة: `npx prisma migrate deploy` نفذت بنجاح.
- [ ] البيانات الأولية مزروعة: `npm run db:seed:licenses`.
- [ ] HTTPS مفعل (Vercel/Railway يفعله تلقائياً، على VPS استخدم Nginx + Certbot).
- [ ] النسخ الاحتياطي لقاعدة البيانات مجدول (Supabase/Railway يفعله تلقائياً، على VPS اضبط cron).
- [ ] اختبر دخول زبون بمفتاح ترخيص حقيقي.
- [ ] اختبر لوحة الإدارة `/license` بإنشاء مفتاح جديد.

---

## 🆘 استكشاف الأخطاء الشائعة

| الخطأ | السبب | الحل |
|--------|-------|-------|
| `P1001: Can't reach database server` | رابط `DATABASE_URL` خاطئ أو قاعدة البيانات غير متاحة | تحقق من الـ Host/Port/Password، وتأكد أن الـ Firewall يسمح بالاتصال |
| `P2003: Foreign key constraint failed` | بيانات غير متوافقة | شغل `npx prisma migrate deploy` بالتسلسل الصحيح |
| `Error: EPERM` على Vercel | محاولة كتابة على نظام ملفات للقراءة فقط | تأكد أن `output: "standalone"` في `next.config.ts` |
| `Module not found: @prisma/client` | لم يتم توليد العميل | أضف `npx prisma generate` في سكريبت البناء |
| `next-swc not found` | binary مفقود | البيئة تحتاج `@next/swc-linux-x64-gnu` — يعمل تلقائياً في Docker/Vercel |

---

## 📞 الدعم

للحصول على مساعدة في النشر:
- **إيميل:** maqtabati@gmail.com
- **واتساب:** +212 0776730934