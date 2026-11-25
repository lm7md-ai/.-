# متطلبات العرض لمساعد التطوير — 24 نوفمبر 2026

مذكرة متطلبات فقط؛ لا تنفذ تطويرًا ولا تعدل شيفرة الموقع أو تصميمه.

## HyperFrames
- إطار مفتوح المصدر يحول HTML/CSS/JavaScript والوسائط إلى MP4 مضبوط الإطارات؛ ليس نموذج توليد فيديو مغلقًا.
- المستودع: https://github.com/heygen-com/hyperframes
- الترخيص: Apache-2.0.
- CLI المحلي: Node.js 22+ وFFmpeg؛ البدء من README عبر `npx hyperframes init`. تثبيت مهارات الوكلاء عبر `npx skills add heygen-com/hyperframes` أو `npx hyperframes skills update`.
- افصل بين CLI المفتوح وStudio ذي الخطة المجانية وخطة Pro المدفوعة المعلنة في README؛ لا توحِ بأن كل نماذج الفيديو مجانية.
- اعرض overview وrequirements وquickStart وتحسينين ومشروعين مستقلين فقط. حالة الاختبار: not_run.

## DeepSeek Harness
- إطار وكلاء قائم على الإضافات وCordis؛ ما يزال Developer Preview وقد تحدث تغييرات كاسرة.
- المستودع: https://github.com/deepseek-ai/deepseek-harness
- الترخيص: MIT؛ راجع THIRD_PARTY_NOTICES.
- تشغيل الواجهة المحلية: Node.js ثم `npx @deepseek-ai/dsh web`؛ العنوان الافتراضي 127.0.0.1:3080. البناء من المصدر: pnpm install ثم pnpm run build ثم pnpm dsh web.
- الواجهة المحلية لا تعني أن استدلال النموذج محلي أو مجاني؛ يلزم إعداد مزود نموذج. وجّه المستخدم إلى SAFETY.md قبل التشغيل.
- حافظ على ترتيب الاقتراحات السابقة في improvements وspinoffs. حالة الاختبار: not_run.

## قواعد مشتركة
1. لا تصف النجوم التراكمية بأنها نمو يومي.
2. اذكر وقت قياس المؤشرات ومصدرها.
3. افصل المتطلبات المحلية عن السحابية والتكاليف.
4. لا تستخدم tested أو "تم اختباره" دون testEvidence.
5. لا تعدل HTML/CSS/JavaScript أو Workflows ضمن هذه المهمة.
