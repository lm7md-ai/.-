# متطلبات عرض محتوى نَبض — تسليم مساعد التطوير

**الحالة:** متطلبات بيانات/عرض فقط؛ لا يُطلب تنفيذ تطوير في هذه الدورة.

## الحقول
- الخبر: `titleAr`, `summaryAr`, `whyItMatters`, `audience`, `nextSteps`, `limitations`, `reviewedAt`, `basis`, `sources`.
- المشروع: `overview`, `requirements`, `quickStart`, `costs`, `localVsCloud`, `alternatives`, `limitations`, `sources`.
- الفكرة: `title`, `problem`, `approach`, `stack`, `steps`, `metric`, `difficulty`, `risks`, `sources`.

## قواعد العرض
- احتفظ بترتيب `improvements`, `spinoffs`, `religious`، ولا تعرض فكرة بلا مصدر أو خطواتها.
- اعرض `testStatus=not_run` بوضوح؛ لا تُظهر اختبارًا ناجحًا ولا تستنتج النجاح من اكتمال البيانات.
- حافظ على ID/URL الأصليين ولا تنشئ هوية بديلة بالعنوان.
- `basis=metadata` يعني أن المقال الكامل لم يُقرأ؛ اعرضه مع القيد الموجود في `limitations`.
- افصل المكتبة البحثية غير المنشورة عن عناصر الموقع المنشورة.

## المشاريع
- EasyOCR: Apache-2.0؛ Python/PyTorch، OCR محلي يدعم العربية؛ لا توجد خدمة سحابية رسمية في المستودع.
- Dograh: BSD-2-Clause؛ وكيل صوتي ذاتي الاستضافة؛ Docker ومتطلبات موارد واضحة، مع تكاليف محتملة لمزودي LLM/STT/TTS.
- Cherry Studio: AGPL-3.0؛ تطبيق Electron متعدد المنصات؛ يتيح مزودات محلية وسحابية، مع اختلاف مسار البيانات بين المزود المباشر والخدمات المدمجة.

## حدود التنفيذ
لا تغيّر شيفرة الموقع أو CSS أو JavaScript أو workflows أو إعدادات Pages أو الخدمات المدفوعة. هذه ملاحظات تسليم فقط ولا تتضمن تطويرًا.
