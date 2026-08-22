---
feature: visits
module: clinical
doc_type: how_to
platform: web
routes: [/visits, /visits/:id]
requires_permission: view_patient_history
requirement_ref: null
actors: [doctor, hospital_manager]
related_features: [consultation, prescriptions, patients]
related_capability: null
related_ui_flows: []
related_glossary: []
tags: [الزيارات, visits, سجل طبي, إلغاء زيارة]
last_updated: 2026-08-20
---

# الزيارات الطبية

## نظرة عامة

صفحة "الزيارات" تعرض سجلاً للقراءة فقط لكل الاستشارات المكتملة أو الملغاة، مع إمكانية إلغاء زيارة مكتملة عند الحاجة.

## خطوات التنفيذ - على الويب

1. من صفحة "الزيارات"، فلتر حسب الحالة والقسم.
2. اضغط على زيارة لعرض تفاصيلها الكاملة: الملاحظات السريرية، التشخيص، الأدوية الخارجية، والطبيب والقسم.
3. لإلغاء زيارة مكتملة، اضغط "إلغاء" وأدخل سبباً إلزامياً.

## قواعد التحقق

- الإلغاء مسموح فقط لزيارة بحالة "مكتملة" (completed).
- الإلغاء مسموح فقط للطبيب الذي وثّق الزيارة، أو لمن يحمل صلاحية cancel_visit صراحة.

## الصلاحيات المطلوبة

view_patient_history مطلوبة لعرض قائمة الزيارات وتفاصيلها. cancel_visit مطلوبة للإلغاء من قبل مستخدم غير الطبيب الأصلي.
