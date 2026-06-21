# Tabeebna - Doctor Rating Application

تطبيق تقييم الأطباء والعيادات - منصة آمنة وحديثة لتقييم الخدمات الطبية.

## ✨ المميزات الرئيسية

- 🔒 **أمان عالي** - استخدام Firebase Authentication و Firestore
- 🌙 **تصميم عصري** - واجهة مستخدم احترافية وسهلة الاستخدام
- 📱 **متوافق مع الأجهزة** - يعمل على الويب والأجهزة المحمولة (Capacitor)
- 🔍 **بحث متقدم** - فلترة وبحث سريع عن الأطباء
- ⭐ **نظام تقييمات** - تقييمات وتعليقات من المستخدمين
- 📊 **لوحة تحكم** - إدارة شاملة للأطباء والتقييمات والتبليغات

## 🚀 البدء السريع

### المتطلبات
- Node.js (v16 أو أحدث)
- npm أو yarn

### التثبيت

```bash
# استنساخ المستودع
git clone <repository-url>

# تثبيت المتعلقات
npm install

# إنشاء ملف .env بمتغيرات Firebase
cp .env.example .env
```

### التشغيل

```bash
# تشغيل التطبيق في وضع التطوير
npm start

# بناء الإنتاج
npm run build

# تشغيل الاختبارات
npm test
```

## 🔐 التكوين الأمني

### متغيرات البيئة
تأكد من إنشاء ملف `.env` بالمتغيرات التالية:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### الأمان

✅ **تحسينات الأمان المطبقة:**
- استخدام Firebase Authentication بدلاً من كلمات المرور النصية
- تخزين آمن للبيانات الحساسة في متغيرات البيئة
- عدم الكشف عن بيانات Firebase في الكود
- استخدام Firestore Security Rules للتحكم في الوصول

## 📁 هيكل المشروع

```
src/
├── components/        # مكونات React
│   ├── App.jsx
│   ├── Login.jsx
│   ├── AdminPanel.jsx
│   ├── DoctorCard.jsx
│   ├── SearchResults.jsx
│   └── ...
├── styles/           # ملفات CSS
│   ├── variables.css
│   ├── App.css
│   └── ...
├── firebase.js       # إعدادات Firebase
└── index.js          # نقطة الدخول
```

## 🛠️ التكنولوجيا المستخدمة

- **React 19** - مكتبة واجهات المستخدم
- **React Router** - التنقل بين الصفحات
- **Firebase** - قاعدة البيانات والمصادقة
- **Capacitor** - تطوير تطبيقات محمولة
- **Electron** - تطبيقات سطح المكتب
- **React Toastify** - الإشعارات

## 📝 الترخيص

هذا المشروع تحت ترخيص MIT

## 👥 المساهمة

نرحب بالمساهمات! يرجى فتح issue أو pull request للمساهمة.

## 📧 التواصل

للتواصل والاستفسارات، يرجى استخدام صفحة التواصل في التطبيق.
