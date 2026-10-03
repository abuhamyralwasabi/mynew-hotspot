(function () {
  'use strict';

  function toArabicError(error) {
    var a = String(error || '').trim().toLowerCase();
    if (!a) return 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.';

    if (a.indexOf('invalid username or password') >= 0)
      return 'رمز الكرت غير صحيح أو أن بيانات الدخول المرتبطة به غير صحيحة.';

    if (a.indexOf('user <') >= 0 && a.indexOf('not found') >= 0)
      return 'رمز الكرت غير موجود. تأكد من كتابة الرمز كما هو في الكرت.';

    if (a.indexOf('user ') >= 0 && a.indexOf(' not found') >= 0)
      return 'رمز الكرت غير موجود. تأكد من كتابة الرمز كما هو في الكرت.';

    if (a.indexOf('invalid password') >= 0 || a.indexOf('wrong password') >= 0)
      return 'بيانات كلمة المرور المرتبطة بهذا الكرت غير صحيحة.';

    if (a.indexOf('already authorizing') >= 0 || a.indexOf('retry later') >= 0)
      return 'جاري التحقق من الكرت الآن. انتظر لحظات ثم حاول مرة أخرى.';

    if (a.indexOf('already logged in') >= 0 || a.indexOf('already logged') >= 0)
      return 'هذا الكرت مسجل الدخول حاليًا على هذا الاتصال.';

    if (a.indexOf('simultaneous session limit reached') >= 0 ||
        a.indexOf('no more sessions are allowed') >= 0)
      return 'تم الوصول إلى الحد المسموح لعدد الأجهزة المتصلة بهذا الكرت. سجّل الخروج من الجهاز الآخر ثم حاول مرة أخرى.';

    if (a.indexOf('uptime limit reached') >= 0 ||
        a.indexOf('uptime limit') >= 0 ||
        a.indexOf('session timeout') >= 0)
      return 'انتهى الوقت المتاح لهذا الكرت.';

    if (a.indexOf('traffic limit reached') >= 0 ||
        a.indexOf('transfer limit reached') >= 0 ||
        a.indexOf('bytes limit reached') >= 0)
      return 'انتهى رصيد البيانات المتاح لهذا الكرت.';

    if (a.indexOf('no valid profile found') >= 0 ||
        a.indexOf('profile is not valid') >= 0)
      return 'هذا الكرت غير صالح حاليًا أو انتهت صلاحيته.';

    if (a.indexOf('invalid calling-station-id') >= 0)
      return 'هذا الكرت مقترن بجهاز آخر ولا يمكن استخدامه من هذا الجهاز.';

    if (a.indexOf('radius') >= 0 &&
        (a.indexOf('timeout') >= 0 || a.indexOf('not responding') >= 0 ||
         a.indexOf('unreachable') >= 0))
      return 'تعذر الوصول إلى خادم المصادقة. حاول مرة أخرى بعد لحظات.';

    if (a.indexOf('access-reject') >= 0)
      return 'تم رفض بيانات الكرت من نظام المصادقة. تأكد من صلاحية الكرت ثم حاول مرة أخرى.';

    if (a.indexOf('disabled') >= 0 && a.indexOf('user') >= 0)
      return 'هذا الكرت غير مفعل حاليًا. يرجى مراجعة نقطة البيع أو الدعم الفني.';

    return 'تعذر تسجيل الدخول باستخدام هذا الكرت. تأكد من صحة الرمز وصلاحيته ثم حاول مرة أخرى.';
  }

  window.toArabicError = toArabicError;

  window.hideHalfCard = function (value) {
    value = String(value || '').toLowerCase();
    if (value.indexOf('t-') === 0) return 'تجربة مجانية';
    if (value.indexOf(':') >= 0) return 'اشتراك';
    var n = Math.ceil(value.length / 2);
    return value.substring(0, n) + '*'.repeat(n);
  };
})();
