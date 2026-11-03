# متطلبات عرض نَبض — تسليم مساعد التطوير (دون تنفيذ تطوير)

- لا تعدّل شيفرة الموقع أو CSS أو JavaScript أو workflows أو إعدادات Pages في هذه الدورة.
- السجلات الجديدة في `site/data/editorial.json` مرتبطة بمعرفات feed الأصلية؛ لا تستنتج معرفًا بديلًا من العنوان.
- تفاصيل الخبر يجب أن تعرض: `titleAr`, `summaryAr`, `whyItMatters`, `audience`, `nextSteps`, `limitations`, `reviewedAt`, `basis`, `sources`.
- أظهر `basis=metadata` بوضوح على خبر BBC؛ لا تعرضه كقراءة مقال كامل.
- لا تعرض السجلات الثلاثة في تقرير pending ولا السجلات السبعة seen-only كأخبار منشورة.
- ملف NVIDIA Auto Ontology dossier موجود تحت `editorial/library/research-only/` و`siteVisible=false`. عنصر feed المرتبط به نوعه news، لذلك لا تنشئ بطاقة مشروع عامة ولا تغيّر kind أو ID.
- إذا أضيفت لاحقًا بطاقة مشروع، فيجب أن تستخدم هوية feed من نوع project وروابطه الأصلية، وأن تعرض overview وrequirements وquickStart وcosts وlocalCloud وalternatives وimprovements وspinoffs وreligious وsources.
- حافظ على ترتيب الأفكار السابقة وروابطها، ولا تُظهر أي اقتراح على أنه مختبر ما لم يتضمن testEvidence صريحًا.
- أي تغييرات عرض مستقبلية تتطلب PR مستقلًا؛ هذا الملف متطلبات فقط.
