# تسليم بيانات نَبض — 2 نوفمبر 2026، 20:45 UTC

## نطاق التغيير
- بيانات تحريرية فقط في `site/data/editorial.json` وملفات `editorial/incoming` و`editorial/library` و`editorial/pending`.
- لا تعدّل JavaScript أو CSS أو HTML أو workflows أو إعدادات Pages أو الجدولة.
- لا تعدّل `site/data/feed.json` أو `site/data/seen.json` أو `site/data/status.json`.

## أخبار الدورة
أضيفت أربعة سجلات جديدة بمعرفاتها وروابطها الأصلية:
- `de34c77e9b40391662` — ورقة الخطوط الأساسية البسيطة.
- `4b574d09afc136bbaa` — ورقة TSFLab.
- `50a265312cccb0d6fa` — معايير وكلاء التعليم؛ basis=metadata لأن النص الكامل للوثيقة لم يُفتح.
- `97fc819f73dad80e77` — خبر DeepSeek؛ basis=metadata لأن رابط الناشر الأصلي تعذر فتحه، مع توثيق المستودع الرسمي.

اعرض حقول `titleAr`, `summaryAr`, `whyItMatters`, `audience`, `nextSteps`, `limitations`, `reviewedAt`, `basis`, `sources` كما هي. أظهر basis كشارة واضحة؛ لا تحوّل metadata إلى مقال مقروء.

## المشاريع
- `AI Agent Book` موجود في PR #79 كسجل مشروع مرتبط بالتغذية.
- `DeepSeek Harness` موجود في main ومثرى بمعرفه الأصلي.
- ملفا TSFLab وDeepSeek Super-Agent Prototype في `editorial/library/research-only` للبحث الداخلي فقط؛ لا تنشئ لهما بطاقات عامة لأنهما غير موجودين كعنصري project في feed.
- مراجعة المشاريع الثمانية السابقة في ملف مستقل غير منشور؛ لا تنقلها إلى `site/data/library.json` تلقائيًا.

## جودة البيانات
- لا تضف `testEvidence` لأي مشروع أو اقتراح؛ لم تُشغّل هذه المشاريع.
- لا تغيّر ترتيب الاقتراحات الموجودة ولا تستبدل سجلات سابقة.
- حافظ على كل ID وURL حرفيًا. يوجد تعارض هوية واحد موثق بين `7a99eca9b2ce14d9f5` و`e0cbbf211a55e79f34` للرابط نفسه؛ لا تعالج هذا بالتوليد من العنوان.
- لا تعتبر المحتوى منشورًا قبل التحقق من artifact/Pages الفعلي.
