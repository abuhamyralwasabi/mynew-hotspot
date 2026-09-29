# NetPro MikroTik Hotspot Portal

نسخة خفيفة ومُعاد تنظيمها لصفحات MikroTik HotSpot، مع الحفاظ على الهوية البصرية الحالية وإضافة اختيار السرعة وتغييرها أثناء الجلسة.

## المكونات
- `hotspot/` صفحات البوابة التي تُرفع إلى ملفات HotSpot في MikroTik.
- `hotspot/config.js` مصدر بيانات ثابت للباقات والسرعات والإعلانات ونقاط البيع والخدمات.
- `admin/config.html` أداة محلية لتحرير `config.js` وتنزيله؛ لا تستخدم قاعدة بيانات.
- `routeros/speed2.rsc` سكربت On-Login لتطبيق السرعة.
- `routeros/speed2-cleanup-on-logout.rsc` تنظيف Queue اختياري عند الخروج.
- `docs/TEST-CHECKLIST.md` قائمة الاختبارات قبل التشغيل.

## اختيار السرعة
صفحة `login.html` ترسل السرعة في الحقل `domain` حتى يعمل مسار HTTP-CHAP أيضًا. يتم التحقق من القيمة في الواجهة وفي `speed2.rsc`، مع fallback إلى `3M` إذا كانت القيمة غير معروفة.

## تغيير السرعة
الدورة المقصودة هي:
`status.html` → `logout` → `login.html?hs_relogin=1&hs_speed=...` → CHAP → `speed2` → `alogin.html` → `status.html`

هذا هو Re-login flow المطلوب، وليس تعديل Queue مباشرة من المتصفح.

## RouterOS 6
ضع `speed2.rsc` في **On Login** داخل HotSpot User Profile المستخدم. يوصى بوضع سكربت التنظيف في **On Logout**.

يجب اختبار `domain -> /ip hotspot active -> speed2 -> /queue simple` على الراوتر الفعلي قبل اعتماد النظام للمستخدمين؛ صفحات GitHub والمتصفح وحدهما لا يثبتان دورة HotSpot كاملة.

## الأداء
تم التخلص من الاعتماد على Swiper وملفات CSS/JS القديمة، وتجميع الواجهة في CSS/JS أصغر، واستخدام Config واحد بدل تكرار جداول البيانات داخل الصفحات. تم توفير شعار SVG خفيف بدل تحميل صورة PNG كبيرة.

## ملاحظة الإدارة
`config.js` ملف إعدادات عادي وليس قاعدة بيانات. أداة الإدارة المحلية تساعد على تحريره ثم تنزيل نسخة جديدة. لا تضع صفحة الإدارة داخل مجلد HotSpot العام إذا كان الوصول إليها يجب أن يكون للمدير فقط.
