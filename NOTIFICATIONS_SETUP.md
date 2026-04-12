# نظام الإشعارات - Notification System

## 📋 نظرة عامة

تم تنفيذ نظام إشعارات متكامل يقوم بإخطار المستخدمين:
- ✅ عند التعليق على منشوراتهم
- ✅ عند إعجاب الآخرين بمنشوراتهم

## 📁 الملفات المضافة/المعدلة

### ملفات جديدة:

1. **models/Notification.js**
   - نموذج MongoDB للإشعارات
   - يحتوي على: recipient, actor, type, post, comment, message, read, timestamps
   - TTL index لحذف تلقائي بعد 30 يوم

2. **routes/notifications.js**
   - GET /api/notifications - جلب الإشعارات مع pagination
   - GET /api/notifications/unread/count - عدد الإشعارات غير المقروءة
   - PUT /api/notifications/:id - تحديد إشعار واحد كمقروء
   - PUT /api/notifications - تحديد جميع الإشعارات كمقروءة
   - DELETE /api/notifications/:id - حذف إشعار

3. **lib/notifications.js**
   - دوال مساعدة:
     - createNotification() - إنشاء إشعار عام
     - createCommentNotification() - إشعار تعليق
     - createLikeNotification() - إشعار إعجاب
     - deleteCommentNotifications() - حذف إشعارات التعليق

4. **public/notifications.html**
   - صفحة عرض الإشعارات
   - قراءة الإشعارات وتحديث الحالة
   - pagination للتنقل بين الصفحات
   - تنسيق متطابق مع تصميم الموقع

### ملفات معدلة:

1. **server.js**
   - إضافة import للإشعارات routes
   - تسجيل route /api/notifications

2. **routes/comments.js**
   - import createCommentNotification
   - إنشاء إشعار عند التعليق الجديد

3. **routes/posts.js**
   - import Notification
   - إنشاء إشعار إعجاب عند الإعجاب بالمنشور
   - حذف إشعار عند الإلغاء

4. **public/js/app.js**
   - إضافة زر الإشعارات في navbar
   - عداد الإشعارات غير المقروءة (badge)
   - دالة loadNotificationCount() لتحديث العداد

## 🔧 كيفية العمل

### عند إضافة تعليق:
```
1. المستخدم A ينشر منشور
2. المستخدم B يعلق على المنشور
3. تُنشأ إشعارات جديدة لـ المستخدم A
4. رسالة: "أعجب بمنشورك: 'عنوان المنشور'"
```

### عند الإعجاب بمنشور:
```
1. المستخدم A ينشر منشور
2. المستخدم B يعجب بالمنشور
3. تُنشأ إشعارات جديدة لـ المستخدم A
4. رسالة: "اعجب بمنشورك: 'عنوان المنشور'"
5. إذا أرجع B الإعجاب، يُحذف الإشعار
```

### تحديث العداد:
```
1. عند تحديث UI auth (updateAuthUI)
2. يتم جلب عدد الإشعارات غير المقروءة
3. إذا كان > 0، يظهر الـ badge مع العدد
4. الحد الأقصى للعداد: 9+
```

## 🎨 التصميم

الإشعارات متطابقة مع تصميم الموقع:
- **الألوان**: استخدام CSS variables (--color-primary, --color-accent, إلخ)
- **الخطوط**: Amiri (للعناوين)، Cairo (للنصوص)
- **الانتقالات**: smooth transitions
- **RTL**: دعم كامل للنص العربي

### عناصر التصميم:

1. **الإشعارات غير المقروءة**:
   - خلفية gradient بالأزرق الأساسي
   - نص أبيض

2. **الإشعارات المقروءة**:
   - خلفية بيضاء
   - نص مخفف

3. **صورة المستخدم**:
   - 40x40px مستديرة
   - UI-avatars fallback

4. **العداد في navbar**:
   - Red background (#c53030)
   - أبيض النص
   - 18x18px مستديرة

## 📊 البيانات المخزنة

```javascript
{
  _id: ObjectId,
  recipient: ObjectId,      // صاحب المنشور
  actor: ObjectId,          // من علّق/أعجب
  type: 'comment' | 'like',
  post: ObjectId,           // المنشور
  comment: ObjectId,        // التعليق (إن وجد)
  message: String,          // نص الإشعار
  read: Boolean,            // هل تمت قراءته
  createdAt: Date,          // تاريخ الإنشاء
  updatedAt: Date,
  expiresAt: Date          // TTL index
}
```

## 🔌 API Endpoints

### GET /api/notifications
```
Headers: Authorization: Bearer {token}
Query: page=1, limit=20
Response: {
  notifications: [{ ... }],
  pagination: { page, limit, total, pages }
}
```

### GET /api/notifications/unread/count
```
Headers: Authorization: Bearer {token}
Response: { unreadCount: number }
```

### PUT /api/notifications/:id
```
Headers: Authorization: Bearer {token}
Response: { message, notification }
```

### PUT /api/notifications
```
Headers: Authorization: Bearer {token}
Response: { message, result }
```

### DELETE /api/notifications/:id
```
Headers: Authorization: Bearer {token}
Response: { message }
```

## ⚙️ الإعدادات

لا توجد متغيرات بيئة إضافية مطلوبة.

تعتمد الإشعارات على:
- MONGODB_URI - موجود بالفعل
- JWT_SECRET - موجود بالفعل

## 🧹 التنظيف التلقائي

- الإشعارات القديمة (> 30 يوم) يتم حذفها تلقائياً
- عند حذف تعليق، يتم حذف إشعاراته المرتبطة

## 🚀 الاستخدام

### للمستخدم:

1. **عرض الإشعارات**:
   - انقر على جرس الإشعارات في navbar
   - أو اذهب إلى /notifications.html

2. **تحديد كمقروء**:
   - انقر على الإشعار مباشرة
   - أو انقر "تحديد الكل كمقروء"

3. **الانتقال للمنشور**:
   - انقر على الإشعار
   - سينقلك للمنشور المرتبط

### للمطور:

```javascript
// إنشاء إشعار مخصص
import { createNotification } from './lib/notifications.js';

await createNotification({
  recipient: userId,
  actor: currentUserId,
  type: 'custom', // أو 'comment', 'like'
  post: postId,
  message: 'رسالة مخصصة'
});
```

## ✅ ميزات متقدمة (مستقبلاً)

- [ ] إشعارات real-time مع WebSocket
- [ ] تنبيهات بريد إلكتروني
- [ ] إشعارات الإجابة على التعليقات
- [ ] إعدادات التنبيهات (تفعيل/تعطيل)
- [ ] تجميع الإشعارات المتشابهة

## 🐛 استكشاف الأخطاء

### لا تظهر الإشعارات:
1. تأكد من تسجيل دخول المستخدم
2. تحقق من وحدة التحكم في المتصفح (F12)
3. تأكد من حفظ البيانات في عمود recipient

### العداد لا يتحدث:
1. تحقق من loadNotificationCount() في app.js
2. تأكد من authorization header صحيح
3. تحقق من مسار API

## 📝 ملاحظات

- لا يتلقى المستخدم إشعار عن أفعاله الخاصة
- الإشعارات تُرتب حسب الأحدث أولاً
- يمكن حذف الإشعارات بشكل نهائي
