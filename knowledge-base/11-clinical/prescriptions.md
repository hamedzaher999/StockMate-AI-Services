---
feature: prescriptions
module: clinical
doc_type: how_to
platform: web
routes: [/prescriptions, /prescriptions/:id]
requires_permission: view_patient_history
requirement_ref: null
actors: [doctor, hospital_manager]
related_features: [consultation, dispensing]
related_capability: null
related_ui_flows: []
related_glossary: []
tags: [الوصفات الطبية, prescriptions, دورة, تجديد, إلغاء, cycle]
last_updated: 2026-08-20
---

# الوصفات الطبية

## نظرة عامة

كل وصفة طبية تمر بدورات (Cycles) متتابعة إن كانت متكررة (يومية/أسبوعية/شهرية)، ولكل دورة حالة صرف مستقلة. يمكن تجديد وصفة منتهية أو إلغاؤها من قبل الطبيب المسؤول.

## خطوات التنفيذ - على الويب

1. من صفحة "الوصفات الطبية"، فلتر حسب الحالة، حالة الدورة، أو القسم.
2. اضغط على وصفة لعرض تفاصيلها: تقدّم الدورة الحالية، عناصر الوصفة، والكمية الموصوفة/المصروفة لكل عنصر.
3. لتجديد وصفة نشطة، افتح صفحتها واضغط "تجديد"، اختر زيارة مكتملة (يجب أن تكون للطبيب نفسه ولنفس المريض) وحدّد تفاصيل الوصفة الجديدة.
4. لإلغاء وصفة نشطة، اضغط "إلغاء" وأدخل سبباً إلزامياً.

## قواعد التحقق

- حالات الوصفة: active، completed، cancelled. حالات الدورة الحالية (Cycle Status): ready (جاهزة للصرف)، partially_delivered (صُرفت جزئياً)، delivered (صُرفت بالكامل)، missed (فاتت دون صرف)، cancelled (أُلغيت).
- التجديد مسموح فقط للوصفة النشطة (active)، ويتطلب زيارة مكتملة لنفس المريض أُجريت من قبل نفس الطبيب مقدِّم طلب التجديد.
- التجديد يُحوّل الوصفة القديمة تلقائياً إلى حالة "مكتملة" (completed) وينشئ وصفة جديدة مرتبطة بها.
- الإلغاء والتجديد مسموحان فقط للطبيب الذي كتب الوصفة، أو لمن يحمل صلاحية manage_all_prescriptions.
- الإلغاء مسموح فقط للوصفة النشطة (active).

## الصلاحيات المطلوبة

view_patient_history أو dispense_prescription مطلوبة لعرض تفاصيل وصفة. renew_prescription مطلوبة للتجديد. cancel_prescription مطلوبة للإلغاء (بالإضافة لشرط الملكية أو manage_all_prescriptions).
