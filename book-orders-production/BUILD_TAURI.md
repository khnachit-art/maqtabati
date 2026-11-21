# بناء تطبيق Tauri (EXE Installer)

## المتطلبات

1. **Node.js 18+** و npm
2. **Rust** (لتجميع الكود الخلفي)
   - Windows: `winget install Rustlang.Rustup` ثم `rustup default stable`
   - أو تحميل من: https://rustup.rs/
3. **Microsoft Visual C++ Build Tools** (Windows فقط)
   - تحميل من: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - اختر "C++ build tools" و "Windows 10 SDK"

## خطوات البناء

```bash
# 1. تثبيت التبعيات
npm install

# 2. تثبيت Tauri CLI (إذا لم يكن مثبتاً)
npm install -D @tauri-apps/cli

# 3. تشغيل وضع التطوير (للاختبار)
npm run tauri:dev

# 4. بناء المثبت (EXE Installer)
npm run tauri:build
```

## المخرجات

بعد البناء الناجح، ستجد الملفات في:
- `src-tauri/target/release/bundle/nsis/Book-Orders_1.0.0_x64-setup.exe` (Windows Installer)
- `src-tauri/target/release/book-orders.exe` (الملف التنفيذي المباشر)

## تثبيت الملف على حاسوب العميل

1. انقل ملف `.exe` إلى حاسوب العميل
2. انقر نقراً مزدوجاً للتثبيت
3. سيظهر في قائمة ابدأ وتحت اسم "Maqtabati"
4. قاعدة البيانات ستخزن تلقائياً في `%APPDATA%\Maqtabati\maqtabati.db`

## إعدادات مهمة

- **قاعدة البيانات**: SQLite محلية في مجلد بيانات التطبيق
- **اللوجو**: قابل للتغيير من صفحة "الإعدادات" → "اللوجو"
- **النسخ الاحتياطي**: متاح من صفحة "الإعدادات" → "النسخ الاحتياطي"
- **استيراد Excel**: متاح من صفحة "الإعدادات" → "قاعدة البيانات" → "استيراد من Excel"

## استكشاف الأخطاء

### خطأ "link.exe not found"
ثبت Visual C++ Build Tools

### خطأ "rustc not found"
ثبت Rust عبر rustup وأعد تشغيل التيرمنال

### خطأ في بناء Next.js
```bash
npm run build
```
تحقق من أخطاء TypeScript/ESLint

### التطبيق لا يفتح
- تحقق من Windows Defender / Antivirus
- شغل كمسؤول للمرة الأولى