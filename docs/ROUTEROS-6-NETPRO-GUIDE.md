# NetPro HotSpot + RouterOS 6.49.x
## دليل التركيب والتوافق مع configuration.rsc

> الهدف من هذا الدليل هو ربط بوابة NetPro المخصصة مع الراوتر الظاهر في ملف `configuration.rsc`، ثم تجهيز منفذ `ether2` لخط يمن نت، مع الحفاظ على اختيار السرعة وإعادة تسجيل الدخول تلقائيًا.

## 1. ما الذي تم التحقق منه من ملف الراوتر

ملف التصدير يوضح أن الجهاز هو **RB1100Dx4** ويعمل على **RouterOS 6.49.19**.

التوزيع الحالي للمنافذ:

- `ether1` اسمه `WAN` ومخصص حاليًا لخط Starlink، ويستخدم DHCP Client.
- `ether2` موجود حاليًا كعضو في Bridge اسمه `OUT`، ولذلك يجب فصله من الـBridge قبل استخدامه كـWAN2.
- `ether3` لديه شبكة `10.0.1.0/24` وHotSpot مستقل باستخدام `hsprof2`.
- `ether12` لديه `3.3.3.2/24` وتوجد له إعدادات DHCP/HotSpot، لكنه موجود أيضًا كعضو في Bridge `OUT`. هذا تعارض تصميمي ينبغي مراجعته قبل إجراء إعادة هيكلة كبيرة للمنافذ.
- بقية المنافذ الداخلية مستخدمة ضمن `OUT` أو ضمن منظومة VLANs الموجودة أصلًا.

ملفات HotSpot الحالية تستخدم:

- `html-directory=netpro`
- `hsprof1` لشبكات VLAN العديدة
- `hsprof2` لـ`ether3` و`ether12`
- `use-radius=yes`
- DNS names ظاهرها `p.net` و`P.com`

لذلك صفحة NetPro الحالية مناسبة من ناحية متغيرات HotSpot ولا تحتاج إلى تغيير مساراتها إلى مجلد آخر؛ المطلوب فقط رفع محتويات مجلد `hotspot/` إلى مجلد `netpro` على الراوتر.

---

## 2. مهم جدًا قبل أي تعديل

خذ Backup من الراوتر أولًا:

```routeros
/system backup save name=before-netpro-dualwan
/export file=before-netpro-dualwan
```

كما أن ملف التصدير يحتوي على بيانات اعتماد حساسة. بعد استخدام هذا التصدير في بيئة عمل أو مشاركته مع أي جهة، يجب تغيير الأسرار الخاصة بالإدارة وRADIUS/User Manager.

---

# 3. إضافة يمن نت على ether2

## الحالة الحالية للمودم

بحسب وصفك، مودم يمن نت نفسه هو الذي ينفذ اتصال PPPoE ويخرج إنترنت إلى منفذ Ethernet.

في هذه الحالة **لا ننشئ PPPoE Client على MikroTik**.

الراوتر سيعامل منفذ `ether2` كـWAN عادي، ويستقبل منه IP/Gateway من مودم يمن نت عبر DHCP.

هذه هي الطريقة الأقل تدخلاً على الإعداد الحالي.

### الخطوة 1: فصل ether2 عن شبكة التوزيع

```routeros
/interface bridge port
remove [find where bridge="OUT" and interface="ether2"]

/interface ethernet
set [find where name="ether2"] name="YEMENNET-WAN" comment="YemenNet ADSL 2M"
```

### الخطوة 2: إضافة WAN Interface List

```routeros
/interface list
add name=WAN comment="NetPro Internet uplinks"

/interface list member
add list=WAN interface=WAN
add list=WAN interface=YEMENNET-WAN
```

إذا كانت قائمة `WAN` موجودة بالفعل، لا تعيد إنشاءها.

### الخطوة 3: إضافة DHCP Client على يمن نت

```routeros
/ip dhcp-client
add interface=YEMENNET-WAN \
    add-default-route=no \
    use-peer-dns=no \
    use-peer-ntp=no \
    disabled=no \
    comment="NetPro WAN2 YemenNet DHCP"
```

بعدها افحص:

```routeros
/ip dhcp-client print detail where interface=YEMENNET-WAN
```

يجب أن ترى `status=bound` مع عنوان IP وGateway حقيقيين.

روترOS يستطيع أخذ العنوان والـGateway تلقائيًا من DHCP، كما يستطيع تنفيذ Lease Script عند تغير الـGateway إذا احتجنا لاحقًا إلى سياسة Routing تعتمد على Gateway متغير. citeturn578782search0

---

# 4. كيف يتم دمج Starlink + YemenNet

هناك فرق مهم بين:

**دمج الخطوط على مستوى الاتصالات**

و

**دمج خطين في اتصال Download واحد**.

الـMulti-WAN العادي لا يجعل ملف فيديو واحدًا بسرعة Starlink + 2Mbps في نفس اللحظة. يتم توزيع الاتصالات المختلفة على المسارات، بينما تظل حزم الاتصال الواحد على مسار واحد. هذا هو سلوك per-connection load balancing. citeturn334697search1

## الطريقة الأساسية المقترحة للـHotSpot

نظرًا لأن HotSpot في MikroTik يعتمد على web-proxy ويمكنه الاعتماد على جدول الـdefault/main routing، فـPCC مع جداول متعددة ليس اختيارًا أعمى مناسبًا لهذا السيناريو. توثيق MikroTik نفسه يذكر هذا القيد، ويشرح أيضًا أن حركات mangle مع HotSpot تحتاج إلى مراعاة Local Routing. citeturn334697search0turn876350search0

لذلك يكون الأساس الآمن هنا:

### ECMP داخل جدول main

نجعل Starlink وYemenNet مسارين default متساويي الـdistance أثناء عمل الخطين.

على Starlink، بدّل DHCP Client الحالي إلى مسافة 1:

```routeros
/ip dhcp-client
set [find where interface="WAN"] \
    default-route-distance=1 \
    use-peer-dns=no \
    use-peer-ntp=no \
    disabled=no
```

وعلى YemenNet، بعد نجاح DHCP:

```routeros
/ip dhcp-client
set [find where interface="YEMENNET-WAN"] \
    add-default-route=yes \
    default-route-distance=1 \
    use-peer-dns=no \
    use-peer-ntp=no
```

بهذا يصبح لدينا مساران default بنفس الـdistance عندما يكون الخطان متاحين، ويستطيع RouterOS توزيع الاتصالات على الاثنين داخل الـmain table.

### لماذا لا أعطي وزنًا ثابتًا 50/50؟

لأن خط يمن نت عندك **2Mbps** بينما سرعة Starlink الفعلية غير موجودة في ملف التصدير. توزيع نصف الاتصالات على خط 2Mbps قد يكون غير مناسب إذا كان Starlink أسرع بكثير.

في أول مرحلة، راقب:

```routeros
/interface monitor-traffic WAN
/interface monitor-traffic YEMENNET-WAN
```

ثم قرر هل تريد:

- ECMP متساويًا للاتصالات.
- أو جعل YemenNet خطًا احتياطيًا فقط عبر مسافة أعلى.
- أو الانتقال إلى سياسة Weighted PCC بعد اختبار خاص بالـHotSpot.

### إذا أردت YemenNet كاحتياطي فقط

استخدم:

```routeros
/ip dhcp-client
set [find where interface="YEMENNET-WAN"] default-route-distance=2
```

في هذه الحالة Starlink هو الأساسي، ويمن نت يتدخل عند سقوط الأول. هذا ليس Load Balancing بل Failover.

---

# 5. ملاحظة مهمة عن PCC الموزون

PCC ممتاز لتوزيع الاتصالات بنسب، مثل 9:1، عندما تكون سعة Starlink أكبر بكثير من خط 2Mbps. لكن MikroTik توثق أن HotSpot ليس حالة عادية لـPCC بسبب اعتماد captive portal على web-proxy والـdefault routing table. لذلك لا أنصح بتطبيق PCC موزون على الراوتر الحالي بدون اختبار HotSpot فعليًا. citeturn334697search0turn578782search2

إذا تم الانتقال لاحقًا إلى Weighted PCC، يجب أيضًا المحافظة على استثناءات الشبكات المحلية وواجهات HotSpot من الـmarking حتى لا يتم كسر صفحة الدخول وDNS وHTTP detection. توثيق MikroTik يوضح هذه النقطة صراحة في قسم Multi-uplink HotSpot. citeturn876350search0

---

# 6. ملاحظات على إعداد الراوتر الحالي قبل Multi-WAN

## Rule قديم باسم rth13

يوجد في التصدير:

```routeros
/ip firewall mangle
add action=mark-routing chain=prerouting \
    new-routing-mark=rth13 passthrough=yes \
    src-address=192.168.101.3-192.168.101.180
```

ولا يظهر في ملف التصدير Route مقابل لـ`rth13`.

لذلك يجب فحصه على الراوتر قبل إضافة أي Multi-WAN جديد:

```routeros
/ip route print detail where routing-mark="rth13"
```

إذا لم يعد هذا الـrouting-mark مستخدمًا، يتم تعطيل Rule القديم بدل تركه يتداخل مع سياسة الـWAN الجديدة.

## ether12

ملف التصدير يضع `ether12` ضمن Bridge `OUT`، وفي الوقت نفسه يعطيه IP مستقلًا `3.3.3.2/24` ويضع عليه DHCP/HotSpot. كما يحتوي التصدير نفسه على ملاحظة بأن DHCP لا يعمل على slave interface.

لا أنصح بإعادة بناء توزيع المنافذ 3-13 في نفس خطوة إضافة WAN2. افصل WAN2 أولًا، ثم اختبر، وبعد استقرار الشبكة يمكن إعادة تنظيم ether12 وبنية HotSpot الداخلية في خطوة مستقلة.

## WAN ضمن LAN list

التصدير يحتوي على عضوية `WAN` داخل قائمة `LAN`. عند إنشاء قائمة WAN مستقلة، يجب تنظيف هذه العضوية لأنها عكس التصميم المعتاد وتربك أي Firewall Rules مستقبلية تعتمد على Interface Lists.

---

# 7. تركيب صفحة NetPro على هذا الراوتر

الـHotSpot profiles الحالية تشير إلى:

```routeros
html-directory=netpro
```

لذلك ارفع مجلد المشروع:

```text
hotspot/
├── login.html
├── status.html
├── alogin.html
├── logout.html
├── error.html
├── block.html
├── prices.html
├── redirect.html
├── rlogin.html
├── config.js
├── css/
├── js/
├── fonts/
└── imgs/
```

إلى Files في الراوتر داخل مجلد:

```text
netpro
```

يجب أن تكون النتيجة مثل:

```text
netpro/login.html
netpro/status.html
netpro/alogin.html
netpro/config.js
netpro/css/main.css
netpro/js/app.js
...
```

التوثيق الرسمي يوضح أن `html-directory` هو مكان ملفات HotSpot المخصصة، وأنه يمكن تغيير المجلد الخاص لكل HotSpot profile. citeturn334697search0turn334697search2

وبما أن `hsprof1` و`hsprof2` في التصدير يستخدمان `netpro`، فإن نفس الصفحة يمكنها خدمة كلا النوعين من HotSpot.

---

# 8. Profile خاص لاختيار السرعة

لا تستخدم أحد Profiles الحالية مثل:

```text
3m
5mb
8mb
10mb
15mb
20mb
uprof1
uprof2 10
```

لأن هذه Profiles تحتوي على `rate-limit` ثابت. ووفق توثيق MikroTik فإن `rate-limit` في HotSpot User Profile ينشئ Dynamic Simple Queue للمستخدم. لهذا لا ينبغي أن يكون لدينا rate-limit ثابت + Queue ديناميكي ثاني لنفس العميل. citeturn429567search0

أنشئ Profile خاصًا باسم:

```text
NETPRO-SPEED
```

بالإعدادات:

```routeros
/ip hotspot user profile
add name=NETPRO-SPEED \
    rate-limit="" \
    shared-users=1 \
    add-mac-cookie=no \
    mac-cookie-timeout=0s \
    idle-timeout=10m \
    keepalive-timeout=10m
```

## لماذا rate-limit فارغ؟

لأن `speed2.rsc` سيُنشئ Simple Queue واحدًا لكل عميل ويضع:

```text
max-limit=UPLOAD/DOWNLOAD
```

حسب السرعة التي اختارها العميل.

## لماذا أوقفنا MAC Cookie؟

لأن اختيار السرعة يعتمد على مرور العميل عبر صفحة تسجيل الدخول وإرسال قيمة `domain=<speed>`. إذا تم تجاوز صفحة الدخول بواسطة cookie/mac-cookie، قد لا تصل قيمة السرعة الجديدة إلى المسار الذي نعتمد عليه.

توثيق MikroTik يوضح أن `login-by` هو الذي يحدد طرق المصادقة مثل cookie وhttp-chap وhttp-pap وmac-cookie. citeturn334697search0

---

# 9. On Login — النص الذي يجب وضعه

ملف المشروع الجاهز هو:

```text
routeros/speed2.rsc
```

افتح:

```text
IP → HotSpot → User Profiles → NETPRO-SPEED → Scripts → On Login
```

والصق **محتوى `routeros/speed2.rsc` كاملًا**.

وظيفة السكربت:

1. يأخذ اسم المستخدم والعنوان الحالي.
2. ينتظر ظهور الجلسة في `/ip hotspot active`.
3. يقرأ `active.domain`.
4. يتحقق من السرعة من قائمة مسموحة.
5. إذا لم يجد قيمة صحيحة يستخدم 2M كقيمة أمان.
6. يحذف Queue التي أنشأها NetPro لهذا الهدف فقط.
7. ينشئ Queue جديدة بسرعة الرفع/التحميل المختارة.

توثيق MikroTik يوضح أن متغير `domain` في HotSpot Active هو Domain الخاص بالمستخدم عند استخدام RADIUS، وأن `Mikrotik-Group` يمكن أن يحدد HotSpot profile للمستخدم القادم من RADIUS. citeturn334697search0turn429567search1

> **شرط أساسي:** بعد أول تجربة فعلية، تحقق يدويًا من:
>
> ```routeros
> /ip hotspot active print detail
> ```
>
> يجب أن يظهر `domain=2M` أو القيمة المختارة. إذا بقي `domain` فارغًا، لا تعتبر آلية اختيار السرعة مؤكدة على هذا الراوتر قبل حل سبب ذلك.

---

# 10. Login-by المناسب للسرعة

الـprofiles الحالية في التصدير تستخدم:

```text
cookie,http-chap,http-pap,mac-cookie
```

لبيئة تعتمد على اختيار السرعة وإعادة تسجيل الدخول الصامتة، الأفضل أن يكون الـHotSpot Server Profile المخصص للبوابة:

```routeros
login-by=http-chap,http-pap
```

إذا كنت تريد الإبقاء على Profiles قديمة تستخدم cookie/mac-cookie لمستخدمين آخرين، فلا تغيرها عشوائيًا؛ أنشئ Server Profile مخصصًا للـHotSpot الذي سيعمل ببوابة السرعة، ثم اربط HotSpot servers المقصودة به.

---

# 11. مستخدمو User Manager / RADIUS

هذا الراوتر يستخدم User Manager محليًا وRADIUS، لذلك هناك فرق بين:

- HotSpot User Profile في `/ip hotspot user profile`
- User Manager Profile في `/tool user-manager profile`

توثيق MikroTik يوضح أن User Manager هو RADIUS وأن `Mikrotik-Group` هو الـRADIUS Attribute الذي يحدد HotSpot profile للمستخدم. citeturn429567search1

لذلك بطاقات اختيار السرعة التي يتم توثيقها عبر User Manager يجب أن ينتهي بها الأمر إلى HotSpot profile:

```text
NETPRO-SPEED
```

وليس إلى Profile قديم يحتوي على `rate-limit` ثابت.

لا تغيّر Profiles User Manager الحالية في أول اختبار. أنشئ حساب اختبار واحد فقط، واربطه بالـHotSpot profile الجديد، ثم اختبر.

---

# 12. ماذا يحدث عند تغيير السرعة من status.html

المسار الذي يعتمد عليه المشروع هو:

```text
status.html
   ↓
اختيار سرعة جديدة
   ↓
sessionStorage pending reauth
   ↓
logout.html
   ↓
login.html?hs_relogin=1&hs_speed=...
   ↓
إرسال CHAP + domain=<speed>
   ↓
On Login / speed2.rsc
   ↓
Simple Queue جديدة
   ↓
alogin.html
   ↓
status.html
```

هذا هو سبب أهمية Profile الخاص، وعدم وجود `rate-limit` منافس، وعدم الاعتماد على cookie/mac-cookie للمسار نفسه.

---

# 13. آخر كرت مستخدم

الصفحة تحفظ آخر كرت ناجح داخل متصفح الجهاز.

المفتاح الأساسي هو:

```text
netpro_last_card
```

ويتم كذلك الاحتفاظ بسجل مختصر في:

```text
netpro_card_history
```

ويتم تحديث السجل بعد نجاح المصادقة في `alogin.html`، وليس فقط بمجرد الضغط على زر الدخول.

لهذا زر:

```text
🚀 دخول بآخر كرت
```

يحتاج إلى وجود تسجيل دخول ناجح سابقًا من نفس الجهاز والمتصفح.

---

# 14. اختبار السرعة خطوة بخطوة

أنشئ مستخدم اختبار واحد فقط.

اختر من الصفحة:

```text
2M
```

ثم بعد الدخول:

```routeros
/ip hotspot active print detail where user="TEST-USER"
```

تحقق من:

```text
domain=2M
```

ثم:

```routeros
/queue simple print detail where comment~"^NetProSpeed\\|"
```

يجب أن ترى Queue واحدة للعميل.

بعدها اختر 5M من status page، وانتظر إعادة الدخول، ثم كرر الأوامر. يجب أن تتحول Queue إلى:

```text
400K/5M
```

ويجب ألا توجد Queue ثانية لنفس العميل.

---

# 15. اختبار الرصيد والوقت في status.html

صفحة الحالة الحالية تعتمد على متغيرات HotSpot المباشرة:

- `bytes-in`
- `bytes-out`
- `limit-bytes-total`
- `remain-bytes-total`
- `uptime`
- `session-time-left`
- `domain`

والعرض أصبح عربيًا، مثل:

```text
4 ساعات 16 دقيقة 45 ثانية
735 ميجابايت
1.26 جيجابايت
```

أما النسبة المئوية فتُستخدم فقط للدائرة والشريط المتحرك، بينما `الرصيد المستخدم` و`الرصيد المتبقي` يعرضان كمية البيانات.

---

# 16. خطة التنفيذ الآمنة المقترحة

### المرحلة A — WAN2

1. Backup.
2. فصل `ether2` عن Bridge `OUT`.
3. إعادة تسميته `YEMENNET-WAN`.
4. DHCP Client.
5. التأكد أن YemenNet يعطي Gateway وInternet مستقلًا.
6. عدم تعديل VLANs أو ether12 في نفس اللحظة.
7. مراقبة Starlink وYemenNet.

### المرحلة B — HotSpot Speed

1. رفع ملفات `netpro`.
2. إنشاء `NETPRO-SPEED`.
3. وضع `speed2.rsc` في On Login.
4. التأكد من `domain` داخل Active.
5. اختبار 2M و5M و10M.
6. اختبار last-card.
7. اختبار تغيير السرعة من Status.

### المرحلة C — Load Balancing

1. بعد نجاح المرحلتين أعلاه، فعّل ECMP داخل main table.
2. راقب استخدام الخطين.
3. إذا كان خط 2Mbps يحصل على حمل زائد، لا تضع Weighted PCC مباشرة على HotSpot الحالي؛ أولًا اختبر workaround الخاص بـHotSpot المحلي وmangle، أو استخدم YemenNet كـFailover إذا كان الهدف الأساسي الاستقرار. citeturn334697search0turn334697search1

---

# 17. ملفات المشروع المرتبطة بهذا الدليل

```text
hotspot/login.html
hotspot/status.html
hotspot/alogin.html
hotspot/logout.html
hotspot/config.js
hotspot/js/login.js
hotspot/js/status.js
routeros/speed2.rsc
routeros/netpro-speed-profile.rsc
routeros/dual-wan-yemennet.rsc
```

تم تحديث `config.js` ليحتوي أيضًا على معلومات التوافق مع الراوتر الهدف: `RB1100Dx4`, `RouterOS 6.49.19`, `netpro`, `hsprof1/hsprof2`, وواجهتي WAN المقترحتين.

---

# 18. مراجع MikroTik الرسمية

- HotSpot / Captive Portal: https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot%2B-%2BCaptive%2Bportal
- DHCP Client: https://help.mikrotik.com/docs/spaces/ROS/pages/24805500/DHCP
- Load Balancing: https://help.mikrotik.com/docs/spaces/ROS/pages/4390920/Load%20Balancing
- Per Connection Classifier: https://help.mikrotik.com/docs/spaces/ROS/pages/152600617/Per%20connection%20classifier
- User Manager: https://help.mikrotik.com/docs/spaces/ROS/pages/2555940/User%2BManager


---

# 15. NetPro automatic roaming between APs/VLANs

The portal now keeps only the last successfully authenticated username and the
last selected speed in browser storage. No password is stored.

When the client moves from AP01/VLAN101 to AP02/VLAN102, both networks must
point to the SAME HotSpot Server Profile and the same portal hostname/origin.
Web Storage is isolated by browser origin, so p.net and another hostname do
not share localStorage.

The login page uses the current RouterOS CHAP challenge on the new VLAN and
submits the saved username again. The previous IP address is never reused.

The flow is:

AP01 -> successful login -> alogin.html -> save username/speed

AP02 -> login.html -> read saved username -> one automatic login attempt ->
new CHAP response -> alogin.html -> status.html

A failed automatic attempt is marked for the current browser session so the
page does not create an automatic-login loop. The user can still use the
normal login form or the "دخول بآخر كرت" button.

## Important: same-origin requirement

Use one DNS name for the unified HotSpot Server Profile, for example:

p.net

Do not let one VLAN use p.net while another uses P.com or a router IP if
you expect browser storage to roam with the client.

MikroTik allows a HotSpot server profile to define the DNS name and the HTML
directory. The portal should keep the same html-directory=netpro and one
common login hostname.

---

# 16. Existing user profiles must remain untouched

Do NOT modify or delete the current profiles used by printed cards.

The current export contains many profiles with fixed rate-limit values. They
are intentionally left intact so existing subscribers keep their current
service.

The new NetPro architecture is separate:

* Existing printed-card profiles: unchanged.
* New selectable-speed accounts: use NETPRO-SPEED.
* Package amount/traffic quota and validity: define through the new User
  Manager profiles/limitations.
* NETPRO-SPEED must not carry a fixed rate-limit.

For the new roaming accounts, shared-users=2 is used so a short overlap
between the old AP session and the new AP authentication does not block the
new login immediately. The portal then stores only the successful username and
speed.

Before production, decide whether the new package policy should permit shared
use beyond this short roaming overlap. Do not change existing profiles to
achieve that behavior.

---

# 17. One Server Profile for all VLANs

After you finish the router cleanup, use one HotSpot Server Profile for all
the VLAN HotSpot servers.

Recommended target:

NETPRO-HOTSPOT

Recommended portal-related properties:

* html-directory=netpro
* one common dns-name
* use-radius=yes
* login-by=http-chap,http-pap for selectable-speed accounts

The existing hsprof1 and hsprof2 should not be modified until all current
users and services depending on them have been migrated and tested.

---

# 18. Last-card button vs. automatic roaming

Both paths now use the same authentication engine.

Automatic roaming:
- triggered by a new login page after the client moves to another VLAN/AP;
- reads the last successful username;
- uses the current CHAP challenge;
- performs one attempt only.

"دخول بآخر كرت":
- triggered by the user;
- reads the same saved username;
- uses the same selected speed;
- performs the same authentication path.

This removes the old duplicate logic that previously made the two paths behave
differently.

---

# 19. Speed picker architecture

The login and status pages now use one shared speed-picker.js.

There is one fixed-position popup attached to the document body instead of
separate menus trapped inside cards/forms.

This prevents clipping and stacking-context failures caused by overflow,
backdrop-filter, and nested z-index contexts.

Do not add a second speed picker implementation to login.js or status.js.

---

# 20. Logout behavior

A normal user logout does NOT erase the saved username.

It only disables automatic roaming until the next successful login.

Therefore:

Normal Logout:
  saved username remains
  automatic login becomes disabled

Successful manual login:
  saved username is refreshed
  automatic login becomes enabled again

Successful speed-change re-login:
  pending re-authentication is cleared
  saved username/speed are refreshed
  automatic login remains enabled

This distinction prevents a manual logout from immediately causing the user to
be logged back in when the login page is shown.

---

# 21. Browser storage fallback

The portal uses localStorage plus a first-party cookie fallback for the last
username/speed.

Storage is still origin-scoped. The fallback does not make different
hostnames share storage.

For that reason, unified DNS naming on the router remains mandatory for true
AP/VLAN roaming.
