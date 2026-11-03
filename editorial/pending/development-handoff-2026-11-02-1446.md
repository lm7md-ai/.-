# متطلبات عرض وتسليم محتوى نَبض — 2 نوفمبر 2026

## نطاق التغيير
- بيانات تحريرية فقط: `site/data/editorial.json` وملف incoming وتقرير التدقيق.
- لا تعديل للشيفرة أو التصميم أو workflows أو إعدادات النشر.
- لا تعديل لـ `feed.json` أو `seen.json` أو `status.json`.

## الإثراء
- 9 أخبار جديدة: 4 مواد من دفعة incoming السابقة و5 أخبار أصلية تمت مراجعة مصادرها.
- مشروع واحد أُثري بمعرفه الأصلي: `2e2562d0bda4e0975e` — AI Agent Book.
- لم يُثرَ مشروع NautilusTrader في هذه الدفعة؛ لا تُعرض له تعليمات تشغيل تداول حي أو أي استخدام مراهنات. بقي ضمن قائمة انتظار الإثراء.
- لم يُدّعَ اختبار تشغيل لأي مشروع أو اقتراح؛ بطاقة المشروع تستخدم `basis=readme` وتخلو من `testEvidence`.

## متطلبات العرض للمساعد
1. أظهر `overview`, `requirements`, `quickStart` بوضوح في تفاصيل المشروع.
2. ميّز تجربة `offline-demo` في AI Agent Book بأنها إعادة تشغيل لمسار مكتوب مسبقًا، وليست بحثًا حيًا.
3. اعرض `limitations` و`sources` بجوار الملخص، ولا تعرض أفكار `improvements` أو `spinoffs` على أنها ميزات موجودة.
4. اعرض صعوبة كل اقتراح كتقدير، وحافظ على ترتيب المقترحات السابقة.
5. لا تضف شارة `tested` أو ادعاء اختبار دون `testEvidence`.
6. لا تنشئ بطاقة جديدة من عنوان فقط؛ اربط كل إثراء بالـ ID وURL الأصليين.
7. لا تعرض بيانات المكتبة البحثية غير المنشورة كبطاقات feed عامة.

## قيود التشغيل
- لم تُنفذ أوامر CLI محليًا في هذه الجولة: `python scripts/editorial.py validate`, `python scripts/editorial.py import`, `python -m unittest discover -s tests -v`.
- يُنتظر CI الرسمي لطلب الدمج لتشغيل اختبارات Python والتحقق من `editorial.json` وفحص JavaScript.
- لا تدمج الطلب ما دام دمج main يشغّل workflow الذي يعيد كتابة feed/seen/status خلافًا للقيد.


## تحديث التحقق — 2 نوفمبر 2026، 20:53 بتوقيت السعودية

- فُحصت أحدث `main` (`012536731c6d6d82d430fca40517e9ada31034f7`) والملفات المرجعية؛ لم تتغير الشيفرة أو التصميم أو workflows أو ملفات `feed/seen/status` في هذا الطلب.
- إعادة تدقيق ملفات `editorial/incoming`: 63 ملفًا و592 ظهور سجل؛ 237 مطابقًا ونشطًا ومستوردًا، و350 مستوردًا تاريخيًا خارج التغذية، و5 سجلات `seen_only`، وصفر اختلاف ID/URL وصفر انتهاء مؤكد. بقيت سجلات NVIDIA OpenShell وCanva Craft و1Password for Agents ضمن `seen_only`، بلا توليد هوية بديلة.
- فحص بنيوي مكافئ للملف الجديد: 10 سجلات (9 أخبار ومشروع واحد)، صفر أخطاء، صفر اختلافات ID/URL مع التغذية، وحُفظت سجلات main الـ627 دون فقد أو تعديل. أوامر `python scripts/editorial.py validate editorial/incoming/...` و`python scripts/editorial.py import ...` لم تُنفذ محليًا.
- GitHub Actions PR run [#41441610042](https://github.com/lm7md-ai/.-/actions/runs/41441610042) نجح: 30 اختبار Python، و`validate` على 637 سجلًا في `site/data/editorial.json`، وفحوص JavaScript ناجحة. هذا لا يعني أن CI نفّذ validate على ملف incoming منفردًا.
- آخر نشر ناجح [run #41433056990](https://github.com/lm7md-ai/.-/actions/runs/41433056990)، artifact `13135741085`: 800 عنصر feed و627 سجل editorial؛ لم يظهر أي من المعرفات العشرة الجديدة. تعذّر فتح رابط Pages مباشرة (`DisabledError`)، لذلك تحقق النشر مبني على تنزيل artifact وفحصه، لا على فتح صفحات التفاصيل.
- يبقى PR #79 مفتوحًا وغير مدمج؛ دمجه سيشغّل workflow قائمًا يكتب `feed.json` و`seen.json` و`status.json`، خلافًا لقيد الحماية.
