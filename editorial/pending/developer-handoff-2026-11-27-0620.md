# متطلبات عرض إثراء نَبض — 27 نوفمبر 2026

هذا تسليم متطلبات محتوى فقط؛ لا تنفذ أي تعديل في الشيفرة أو التصميم أو workflows.

## قاعدة الربط
- اقرأ `editorial.items[id]` فقط عندما يطابق `feed.items[id].url` الرابط الأصلي حرفيًا.
- لا تستخدم العنوان أو تشابه العنوان لتوليد هوية بديلة.
- إذا لم يوجد تطابق، اعرض وصف المصدر الأصلي فقط ولا تعرض الإثراء القديم على عنصر جديد.

## تفاصيل الأخبار
- اعرض titleAr وsummaryAr بوضوح.
- افصل whyItMatters بوصفه تحليلًا تحريريًا عن الحقائق الواردة في summaryAr.
- اعرض audience وnextSteps وlimitations.
- أظهر reviewedAt ووسم basis (metadata/article/readme/code/tested).
- اعرض sources كروابط مستقلة مع عناوينها.
- لا تعرض أي ادعاء باعتباره حقيقة إذا كان المصدر يقدمه كاحتمال أو مزعم.

## تفاصيل المشاريع
- أقسام: overview، requirements، quickStart، costs، localVsCloud، alternatives، limitations.
- اعرض improvements وspinoffs وreligious فقط إذا كانت القوائم موجودة وغير فارغة.
- كل فكرة تعرض title وproblem وapproach وstack وsteps وmetric وdifficulty وrisks وsources.
- احتفظ بترتيب الأفكار كما ورد في JSON؛ لا تعِد ترتيبها ولا تستبدلها.
- اعرض difficulty على أنه تقدير، لا حقيقة أو وعد زمني.
- إذا كان testStatus=not_run، اعرض بوضوح «لم يُختبر» ولا تلمح إلى نجاح التنفيذ.
- لا تحول بيانات النجوم أو التفرعات إلى معدل نمو؛ اعرض وقت القياس وكونها أرقامًا تراكمية.

## العناصر الحالية
- HyperFrames وGPT-SoVITS موجودان في Feed الحالي ويجب ربطهما بمعرفيهما الأصليين.
- سجلات OpenShell وCanva Craft و1Password for Agents موجودة في Seen فقط وليست عناصر حالية؛ لا تعرض إثراءها على بطاقة جديدة.
- هذا الملف متطلبات تسليم فقط؛ لا يتضمن تطويرًا أو تعديلًا لواجهة الموقع.
