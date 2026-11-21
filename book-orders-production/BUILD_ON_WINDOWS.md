# بناء ملف EXE على ويندوز - دليل خطوة بخطوة

هذا الدليل يشرح كيف تبني ملف التثبيت `Maqtabati_1.0.0_x64-setup.exe` من الكود المصدري على حاسوب يعمل بنظام **Windows 10/11**.

---

## 📋 المتطلبات المسبقة (ثبّتهم بالترتيب)

### 1. Node.js 18+ (مطلوب)
- **تحميل:** https://nodejs.org/en/download/ → اختر "Windows Installer (.msi)" versione LTS
- **تحقق:** افتح `cmd` أو `PowerShell` واكتب:
  ```cmd
  node --version
  npm --version
  ```
  يجب أن يظهر `v18.x.x` أو أعلى، و `9.x.x` أو أعلى.

### 2. Rust (مطلوب للكود الخلفي)
- **الطريقة الأسهل (winget):**
  ```powershell
  # شغل PowerShell كمسؤول (Run as Administrator)
  winget install Rustlang.Rustup
  ```
  ثم **أعد تشغيل التيرمنال** واكتب:
  ```cmd
  rustup default stable
  rustup update
  ```
- **بديل:** حمل من https://rustup.rs/ وشغّل المثبت، اختر "Default installation"

- **تحقق:**
  ```cmd
  rustc --version
  cargo --version
  ```

### 3. Visual C++ Build Tools (مطلوب للربط - Linker)
- **تحميل:** https://visualstudio.microsoft.com/visual-cpp-build-tools/
- **شغل المثبت** → في تبويب "Workloads" اختر:
  - ✅ **Desktop development with C++**
  - في "Installation details" تأكد من:
    - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
    - ✅ Windows 10 SDK (أحدث نسخة)
    - ✅ C++ CMake tools for Windows
- **اضغط Install** (الحجم ~3-5 جيجا، يستغرق 10-20 دقيقة)

### 4. Git (اختياري لكن مستحسن)
- https://git-scm.com/download/win

---

## 🚀 خطوات البناء

### الخطوة 1: فك الضغط
```
1. انقل ملف book-orders-Tauri-Source.zip إلى سطح المكتب أو أي مجلد
2. انقر باليمين → "Extract All" → اختر مكان (مثلاً: Desktop\Maqtabati-Source)
3. ادخل المجلد المستخرج
```

### الخطوة 2: فتح التيرمنال في المجلد
**طريقة أ (أسهل):**
- في مستكشف الملفات، اكتب `cmd` في شريط العنوان أعلى النافذة → اضغط Enter

**طريقة ب:**
- انقر باليمين في مساحة فارغة داخل المجلد → "Open in Terminal" (ويندوز 11) أو "Open PowerShell window here"

### الخطوة 3: تثبيت تبعيات المشروع
```cmd
npm install
```
- **انتظر 2-4 دقائق** (أول مرة يحمل مكتبات Rust عبر cargo)
- يجب أن ينتهي بدون أخطاء حمراء (Warnings صفراء مقبولة)

### الخطوة 4: بناء المثبت (الخطوة الرئيسية)
```cmd
npm run tauri:build
```

**ماذا يحدث الآن (يستغرق 3-8 دقائق):**
1. `next build` → يجمع React/Next.js إلى ملفات ثابتة في `.next/`
2. `cargo build --release` → يجمع كود Rust (يظهر سطور compilation)
3. `tauri bundle` → ينشئ مثبت NSIS

**إذا نجح، ستظهر رسالة:**
```
✨   Done in 45.2s
```
أو مشابهة.

### الخطوة 5: العثور على الملف النهائي
افتح مستكشف الملفات واذهب إلى:
```
Maqtabati-Source\src-tauri\target\release\bundle\nsis\
```
ستجد:
```
Maqtabati_1.0.0_x64-setup.exe    ← هذا هو الملف المطلوب
```

**انسخه** إلى مكان آمن (سطح المكتب، فلاشة، مجلد مشارك).

---

## ✅ اختبار التثبيت

### على نفس الحاسوب:
1. انقر نقراً مزدوجاً على `Maqtabati_1.0.0_x64-setup.exe`
2. ستظهر شاشة **NSIS Installer**:
   - "Welcome to the Maqtabati Setup Wizard" → **Next**
   - "License Agreement" → **I Agree**
   - "Choose Install Location" → **Next** (الافتراضي: `%LOCALAPPDATA%\Maqtabati`)
   - "Choose Start Menu Folder" → **Install**
   - انتظار شريط التقدم → **Finish** (يمكن تفعيل "Run Maqtabati")

3. سيظهر في **قائمة ابدأ** → اكتب "Maqtabati" → اضغط Enter

### على حاسوب عميل آخر:
- انقل ملف `.exe` فقط (فلاشة، إيميل، OneDrive، رابط تحميل)
- العميل ينقر نقراً مزدوجاً → يثبت → يفتح من قائمة ابدأ
- **لا يحتاج Node، Rust، أو أي أدوات**

---

## 🖼️ لقطات الشاشات المتوقعة (للتحقق)

### 1. شاشة NSIS الترحيبية
```
┌─────────────────────────────────────┐
│  Maqtabati Setup Wizard             │
├─────────────────────────────────────┤
│  Welcome to the Maqtabati           │
│  Setup Wizard.                      │
│                                     │
│  This will install Maqtabati        │
│  1.0.0 on your computer.            │
│                                     │
│  [Next >]                    [Cancel]│
└─────────────────────────────────────┘
```

### 2. اختيار المجلد
```
┌─────────────────────────────────────┐
│  Choose Install Location            │
├─────────────────────────────────────┤
│  Destination Folder:                │
│  C:\Users\<User>\AppData\Local\     │
│  Maqtabati\                         │
│                                     │
│  [Browse...]                        │
│                                     │
│  [Next >]                    [Cancel]│
└─────────────────────────────────────┘
```

### 3. اكتمال التثبيت
```
┌─────────────────────────────────────┐
│  Completing the Maqtabati           │
│  Setup Wizard                       │
├─────────────────────────────────────┤
│  Maqtabati has been installed       │
│  on your computer.                  │
│                                     │
│  ☑ Launch Maqtabati                 │
│                                     │
│  [Finish]                           │
└─────────────────────────────────────┘
```

### 4. التطبيق مفتوح
- نافذة بعرض 1280×800
- شريط علوي باللوجو (أو اللوجو الافتراضي)
- قائمة جانبية: الرئيسية، فهرس الكتب، الطلبات، العملاء، التقرير، الاستلام، الإعدادات

---

## ⚙️ ما يفعله التطبيق أول مرة

| العملية | المكان |
|----------|-------|
| ينشئ قاعدة بيانات SQLite | `%APPDATA%\Maqtabati\maqtabati.db` |
| ينشئ مجلد الإعدادات | `%APPDATA%\Maqtabati\` |
| يضع اللوجو الافتراضي | `%APPDATA%\Maqtabati\logo.png` |
| يضيف مستخدم `admin` / `admin123` | في قاعدة البيانات |

---

## 🔧 استكشاف الأخطاء الشائعة

### خطأ: `'rustc' is not recognized`
**السبب:** Rust غير مثبت أو التيرمنال لم يُعد تشغيله بعد التثبيت.
**الحل:**
```cmd
# أعد تشغيل التيرمنال (أغلق وافتح جديد)
rustc --version
# إذا لم يعمل: أعد تشغيل الحاسوب
```

### خطأ: `link.exe not found` أو `LINK : fatal error LNK1104`
**السبب:** Visual C++ Build Tools غير مثبت أو ناقص المكونات.
**الحل:**
- شغل "Visual Studio Installer" من قائمة ابدأ
- اختر "Modify" على "Visual Studio Build Tools"
- تأكد من تحديد: **Desktop development with C++** + **Windows 10 SDK**
- اضغط Modify وانتظر

### خطأ: `Error: spawn cmd ENOENT` أو `tauri not found`
**السبب:** Tauri CLI غير مثبت في المشروع.
**الحل:**
```cmd
npm install -D @tauri-apps/cli
npm run tauri:build
```

### خطأ: `npm ERR! code E403` أو `403 Forbidden`
**السبب:** مشكلة في registry npm (شبكة/بروكسي).
**الحل:**
```cmd
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
```

### خطأ: `cargo build` يعلق عند `compiling proc-macro2` أو `syn`
**السبب:** أول بناء يحمل الكثير من الكرات (crates) - طبيعي.
**الحل:** انتظر 5-10 دقائق، لا توقف العملية.

### التطبيق يفتح ثم يغلق فوراً / شاشة بيضاء
**السبب:** خطأ في JavaScript أو قاعدة البيانات.
**الحل:**
1. شغل من التيرمنال لترى الخطأ:
   ```cmd
   cd %LOCALAPPDATA%\Maqtabati
   Maqtabati.exe
   ```
2. أو تحقق من اللوجز في `%APPDATA%\Maqtabati\logs\` (إن وجد)

### Windows Defender يمنع التشغيل
**السبب:** ملف غير موقع رقمياً.
**الحل:**
- "More info" → "Run anyway"
- أو انقر باليمين → Properties → ✅ "Unblock" → Apply

### "The application was unable to start correctly (0xc000007b)"
**السبب:** تعارض 32/64 bit (نادر مع Tauri v2).
**الحل:** أعد بناء المشروع على نفس معمارية النظام.

---

## 📂 أين توجد البيانات؟ (للباك أب / نقل)

| الملف/المجلد | المسار الكامل |
|-------------|--------------|
| قاعدة البيانات | `%APPDATA%\Maqtabati\maqtabati.db` |
| اللوجو المخصص | `%APPDATA%\Maqtabati\logo.png` |
| الإعدادات | `%APPDATA%\Maqtabati\settings.json` |
| النسخ الاحتياطية | `%APPDATA%\Maqtabati\dev_backup_YYYYMMDD_HHMMSS.db` |

**لفتح المجلد بسرعة:** اضغط `Win + R` → اكتب `%APPDATA%\Maqtabati` → Enter

---

## 📦 بناء نسخة محدثة مستقبلاً

عند تعديل الكود وتريد إصدار جديد:

```cmd
# 1. ادخل المجلد
cd Maqtabati-Source

# 2. حدث رقم الإصدار في src-tauri/tauri.conf.json
#    غيّر "version": "1.0.0" إلى "1.1.0" مثلًا

# 3. ابنِ مجدداً
npm run tauri:build

# 4. الملف الجديد في نفس المكان:
# src-tauri\target\release\bundle\nsis\Maqtabati_1.1.0_x64-setup.exe
```

---

## 📞 دعم سريع

| المشكلة | الحل السريع |
|----------|-------------|
| "أين الملف النهائي؟" | `src-tauri\target\release\bundle\nsis\Maqtabati_*.exe` |
| "أريد تغيير الأيقونة" | استبدل ملفات `src-tauri\icons\` ثم أعد البناء |
| "أريد تغيير الاسم" | عدل `productName` في `tauri.conf.json` |
| "قاعدة البيانات تالفة" | احذف `%APPDATA%\Maqtabati\maqtabati.db` وأعد تشغيل التطبيق |

---

## ✅ قائمة تحقق قبل التسليم

- [ ] Node.js 18+ مثبت
- [ ] Rust مستقر (`rustup default stable`)
- [ ] Visual C++ Build Tools مع Windows 10 SDK
- [ ] `npm install` نجح بدون أخطاء حمراء
- [ ] `npm run tauri:build` نجح وظهر `Done`
- [ ] ملف `.exe` موجود في `target/release/bundle/nsis/`
- [ ] التثبيت على ويندوز نظيف (VM أو حاسوب آخر) نجح
- [ ] التطبيق يفتح، تظهر الصفحة الرئيسية
- [ ] الإعدادات → اللوجو: يمكن تغييره وحفظه
- [ ] الإعدادات → قاعدة البيانات: يمكن استيراد Excel
- [ ] الإعدادات → النسخ الاحتياطي: ينشئ ملف .db
- [ ] اختبرت على حاسوب **بدون** أدوات التطوير

---

**انتهيت!** ملف `Maqtabati_1.0.0_x64-setup.exe` جاهز للتسليم للعميل. 🎉