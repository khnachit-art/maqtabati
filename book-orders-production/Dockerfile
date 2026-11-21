# استخدام صورة Node.js 20 LTS المبنية على Alpine (خفيفة الوزن)
FROM node:20-alpine AS base

# تثبيت التبعيات اللازمة لـ Prisma و SQLite
RUN apk add --no-cache libc6-compat openssl

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات الحزمة أولاً للاستفادة من طبقة التخزين المؤقت (Cache Layer)
COPY package*.json ./
COPY prisma ./prisma/

# تثبيت التبعيات (بما في ذلك Prisma CLI)
# استخدام --frozen-lockfile يضمن تثبيت الإصدارات الدقيقة
RUN npm ci

# نسخ باقي كود التطبيق
COPY . .

# توليد Prisma Client
RUN npx prisma generate

# بناء التطبيق للإنتاج
RUN npm run build

# ---------------------------
# مرحلة التشغيل (Runtime)
# ---------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# تعيين بيئة الإنتاج
ENV NODE_ENV=production

# نسخ ملفات البناء والملفات الضرورية من مرحلة البناء
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/prisma ./prisma/
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

# إنشاء مستخدم غير جذر للأمان
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# كشف المنفذ
EXPOSE 3000

# تعيين متغيرات البيئة الافتراضية
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# أمر البدء
CMD ["node", "server.js"]