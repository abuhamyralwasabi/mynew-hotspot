/* NetPro Hotspot - editable static configuration. */
window.NETPRO_CONFIG = {
  network: {
    name: "NetPro",
    title: "شبكة NetPro اللاسلكية",
    logo: "imgs/NetPro-Logo.svg",
    copyrightYear: 2026,
    supportPhone: "780201264",
    supportLabel: "دعم فني",
    footerBrand: "🔥 Netpro – تجربة كاملة",
    footerText: "تصميم قسم الـ IT نت برو"
  },
  auth: {
    // NetPro cards use the card code as username and an empty password.
    passwordMode: "blank",

    // The router can authenticate against both:
    //   1) local /ip hotspot user
    //   2) User Manager through RADIUS
    //
    // The portal tries one source first and, only for source/authentication
    // failures, retries once against the opposite source.
    dualAuth: true,
    radiusFirst: true,
    localFallback: true
  },
  router: {
    model: "RB1100Dx4",
    routerOs: "6.49.19",
    htmlDirectory: "netpro",
    serverProfiles: ["NETPRO-HOTSPOT"],
    legacyServerProfiles: ["hsprof1", "hsprof2"],
    hotspotDnsNames: ["p.net", "P.com"],
    usesRadius: true,
    dynamicSpeedProfile: "NETPRO-SPEED",
    wanPorts: {
      starlink: "ether1",
      yemenNet: "ether2"
    },
    distributionPorts: ["ether3", "ether4", "ether5", "ether6", "ether7", "ether8", "ether9", "ether10", "ether11", "ether12", "ether13"]
  },
  messages: {
    welcome: "أهلاً بك في شبكة نت برو، إنترنت سريع وثابت بتجربة أقوى وأكثر استقراراً.",
    marquee: "استخدم الانترنت فيما يرضي الله ✨ نسعى لتقديم خدمة ممتازة على مدار 24 ساعة",
    packageHint: "💡 يمكنك شراء الكروت من أي نقطة بيع معتمدة",
    servicesNotice: "المباريات والترفيه متاح فقط للمشتركين داخل الشبكة."
  },
  promos: [
    { icon: "🏥", title: "مستوصف السلام الطبي:", body: "خصم 20% لحاملي كروت شبكة نت برو!", highlight: "خصم 20%" },
    { icon: "🛒", title: "سوبر ماركت الحسوة:", body: "تخفيضات كبرى بمناسبة الافتتاح، لا تفوت الفرصة!", highlight: "لا تفوت الفرصة!" },
    { icon: "📱", title: "شبكة نت برو اللاسلكي:", body: "بث مباشر + ألعاب + تحميل بسرعة عالية بأسعار منافسة!", highlight: "بأسعار منافسة!" }
  ],
  defaultSpeed: "2M",
  speeds: [
    { value: "256K", label: "سرعة ضعيفة", upload: "128K", download: "256K" },
    { value: "512K", label: "سرعة اقتصادية", upload: "200K", download: "512K" },
    { value: "1M", label: "سرعة عادية", upload: "400K", download: "1M" },
    { value: "2M", label: "سرعة متوسطة", upload: "400K", download: "2M" },
    { value: "3M", label: "سرعة عالية", upload: "400K", download: "3M" },
    { value: "4M", label: "سرعة عالية جداً", upload: "400K", download: "4M" },
    { value: "5M", label: "سرعة خارقة 5 ميجا", upload: "400K", download: "5M" },
    { value: "7M", label: "سرعة خارقة 7 ميجا", upload: "1M", download: "7M" },
    { value: "10M", label: "سرعة خارقة 10 ميجا", upload: "1M", download: "10M" }
  ],
  packages: [
    { price: "100 ريال", time: "4 ساعات", balance: "250 ميجا", validity: "يومين" },
    { price: "200 ريال", time: "8 ساعات", balance: "500 ميجا", validity: "4 أيام" },
    { price: "300 ريال", time: "5 يوم", balance: "800 ميجا", validity: "5 يوم" },
    { price: "500 ريال", time: "5 يوم", balance: "1.25 جيجا", validity: "5 يوم" },
    { price: "1000 ريال", time: "10 يوم", balance: "2.5 جيجا", validity: "10 يوم" },
    { price: "1500 ريال", time: "15 يوم", balance: "3.5 جيجا", validity: "15 يوم" },
    { price: "2500 ريال", time: "30 يوم", balance: "6 جيجا", validity: "30 يوم" },
    { price: "3500 ريال", time: "30 يوم", balance: "9 جيجا", validity: "30 يوم" },
    { price: "5000 ريال", time: "30 يوم", balance: "15 جيجا", validity: "30 يوم" },
    { price: "6000 ريال", time: "30 يوم", balance: "20 جيجا", validity: "30 يوم" }
  ],
  salesPoints: [
    { icon: "🏢", name: "المركز الرئيسي لشبكة نت برو", location: "الشارع الرئيسي" },
    { icon: "🛒", name: "سوبر ماركت الحسوة", location: "بجانب الفرن الآلي الحديث" },
    { icon: "🏪", name: "بقالة بن عفيف", location: "الشارع الرئيسي" },
    { icon: "🏪", name: "بقالة بسام الضالعي", location: "أمام المستوصف الطبي" },
    { icon: "🏪", name: "بقاله القرشي", location: "بالقرب من صيدلية الكويت" },
    { icon: "🛍️", name: "وارد الطيبات للتموينات", location: "بجانب مسجد المهاجرين" },
    { icon: "🏪", name: "بقالة بن أحمد", location: "الشارع الرئيسي" }
  ],
  services: [
    { icon: "🚀", title: "جودة الخدمة", description: "تصفح سريع وألعاب أونلاين بدون تقطيع" },
    { icon: "🛠️", title: "الدعم الفني", description: "فريق جاهز لمساعدتك على مدار الساعة" },
    { icon: "📡", title: "تغطية واسعة", description: "اتصال ثابت في جميع أنحاء المنطقة" },
    { icon: "⚡", title: "سرعات متنوعة", description: "اختر السرعة المناسبة لاستخدامك" }
  ],
  entertainment: [
    { icon: "📺", title: "مباريات مباشرة", path: "/live" },
    { icon: "🎥", title: "أفلام ومسلسلات", path: "/movies" },
    { icon: "🎬", title: "أنمي حصري", path: "/anime" },
    { icon: "☕", title: "استراحة ترفيهية", path: "/rest" }
  ],
  whyNetpro: [
    { icon: "👋", text: "أهلاً بك في شبكة NetPro اللاسلكية" },
    { icon: "🚀", text: "نوصل الإنترنت إلى المنازل والمحلات بسرعة عالية" },
    { icon: "📍", text: "تركيب فوري داخل نطاق التغطية" },
    { icon: "📡", text: "تغطية قوية واتصال ثابت بدون انقطاع" },
    { icon: "💎", text: "سرعات متنوعة تناسب جميع الاستخدامات" },
    { icon: "🎮", text: "تصفح سريع – يوتيوب – ألعاب أونلاين بدون تقطيع" },
    { icon: "⚽", text: "بث مباشر للمباريات بجودة عالية 🔥" },
    { icon: "🛠️", text: "دعم فني سريع عند الحاجة" },
    { icon: "⏰", text: "خدمة مستمرة واستقرار عالي على مدار الساعة" },
    { icon: "☕", text: "استراحة مجانية للمشتركين" }
  ]
};
