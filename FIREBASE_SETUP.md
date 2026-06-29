# Firebase Integration Setup Guide

## 🚀 مقدمة

نظام SKY ERP مدمج مع Firebase Firestore لتخزين البيانات السحابي والعمل دون إنترنت.

## ✅ ما تم تطبيقه:

### 1. **firebase-config.js** ✨
- ✅ دعم Offline Persistence (العمل دون إنترنت)
- ✅ معالجة أخطاء محسّنة
- ✅ دالة `initFirebase()` للتحكم الأفضل
- ✅ Flag `firebaseReady` للتحقق من الجاهزية

### 2. **firebase-service.js** ✨
- ✅ حفظ معرّفات الملفات (Document IDs) بشكل صحيح
- ✅ Real-time Listeners عبر `listenToCollection()`
- ✅ Batch Operations للعقود والأقساط
- ✅ معالجة أخطاء تفصيلية مع رموز
- ✅ دعم الاستعلامات عبر `queryCollection()`
- ✅ دالة حذف الصور `deleteImage()`

## 🔐 بيانات Firebase الحالية:

```javascript
apiKey: "AIzaSyC0UmVMet6emQSY7ZjlGmAOYlEen_sJn8o"
authDomain: "sky-erp-89b78.firebaseapp.com"
projectId: "sky-erp-89b78"
storageBucket: "sky-erp-89b78.firebasestorage.app"
messagingSenderId: "592994986030"
appId: "1:592994986030:web:68c6f6a62b097b1d0757bf"
```

## 📦 Collections المتوفرة:

1. **clients** - بيانات العملاء والضامنين
2. **inventory** - المخزون والأجهزة
3. **contracts** - العقود والمبيعات
4. **installments** - الأقساط والدفعات
5. **collectorCustodies** - عهد المحصلين
6. **treasuryTransactions** - حركات الخزينة
7. **users** - المستخدمين والأدوار
8. **auditLogs** - سجلات التدقيق الأمني
9. **settings** - إعدادات النظام

## 🛠️ الاستخدام:

### التحقق من جاهزية Firebase:
```javascript
if (window.FirebaseService.isAvailable()) {
  console.log("✅ Firebase متاح");
}
```

### تحميل البيانات:
```javascript
const data = await window.FirebaseService.loadAllData();
if (data) {
  console.log("✅ تم تحميل البيانات من Firestore");
}
```

### الاستماع للتغييرات الحية:
```javascript
const unsubscribe = window.FirebaseService.listenToCollection('clients', (data) => {
  console.log("📊 العملاء:", data);
});

// لإيقاف الاستماع:
unsubscribe();
```

### حفظ بيانات جديدة:
```javascript
const result = await window.FirebaseService.syncAction('addClient', {
  id: 'cli-123',
  name: 'محمد أحمد',
  phone: '01012345678'
});

if (result.success) {
  console.log("✅ تم حفظ العميل");
}
```

## 🌐 العمل دون إنترنت (Offline Mode):

Firebase يعمل بـ IndexedDB محلياً:
- البيانات تُخزن محلياً تلقائياً
- عند عودة الإنترنت، تُزامن البيانات تلقائياً
- جميع العمليات تعمل سواء كان هناك إنترنت أو لا

## ⚠️ معالجة الأخطاء:

جميع رسائل الأخطاء توجد في Console:
- ✅ تبدأ برمز علامة (✅, ⚠️, ❌)
- توضح نوع العملية والمشكلة
- تساعد في التصحيح السريع

## 📝 سجل التحديثات:

### v1.1 (29 يونيو 2026)
- ✨ تحسين معالجة الأخطاء
- ✨ إضافة Real-time Listeners
- ✨ دعم Batch Operations
- ✨ حفظ Document IDs بشكل صحيح

## 💡 نصائح مهمة:

1. **تفعيل Offline Mode**: تأكد أن `offlineMode` مفعل للعمل بدون إنترنت
2. **فحص الأخطاء**: افتح Developer Tools (F12) لرؤية الرسائل التفصيلية
3. **استخدام IDs**: تأكد دائماً من وجود ID مناسب لكل وثيقة
4. **الاستماع للتحديثات**: استخدم Listeners للتحديثات الفورية

## 🔧 استكشاف الأخطاء:

| المشكلة | الحل |
|--------|------|
| Firebase غير متاح | تحقق من الإنترنت وجودة الاتصال |
| البيانات لم تُحفظ | افتح Console وابحث عن رسائل الخطأ |
| Offline Mode بطيء | قلل حجم البيانات المخزنة محلياً |
| Real-time Listener لم يعمل | تأكد أن Document IDs صحيحة |

---

**آخر تحديث**: 2026-06-29
**الحالة**: ✅ جاهز للعمل
