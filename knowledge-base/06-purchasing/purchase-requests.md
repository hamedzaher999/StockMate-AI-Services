---
feature: purchase-requests
module: purchasing
doc_type: how_to
platform: web
routes: [/purchasing/requests, /purchasing/requests/:id]
requires_permission: view_purchasing_history
requirement_ref: null
actors: [warehouse_manager, purchasing_manager, hospital_manager]
related_features: [purchase-receipts-create, variants]
related_capability: null
related_ui_flows: []
related_glossary: []
tags: [طلبات الشراء, purchase requests, موافقة, رفض, إلغاء, draft]
last_updated: 2026-08-20
---

# طلبات الشراء

## نظرة عامة

طلب الشراء يمر بدورة حياة متعددة المراحل من المسودة حتى الاكتمال، تشمل موافقة مزدوجة (مدير المستشفى ثم مدير المشتريات) قبل أن يصبح جاهزاً للاستلام الفعلي عبر إيصالات الشراء.

## خطوات التنفيذ - على الويب

1. من صفحة "طلبات الشراء"، اضغط "طلب جديد"، أضف عنصراً واحداً أو أكثر (متغير، كمية مطلوبة، سعر تقديري اختياري)، وأضف ملاحظات إن رغبت.
2. يُحفَظ الطلب كمسودة (draft) عند الإنشاء.
3. لتقديم الطلب رسمياً، افتح تفاصيله واضغط "تقديم" (Submit) لإرساله لموافقة المستشفى.
4. صاحب صلاحية الموافقة على مستوى المستشفى يوافق أو يرفض الطلب من نفس الصفحة.
5. بعد موافقة المستشفى، ينتقل الطلب لمدير المشتريات الذي يحدد الكمية الموافق عليها لكل عنصر (لا يمكن أن تتجاوز الكمية المطلوبة) قبل الموافقة النهائية.
6. بعد الموافقة النهائية تصبح الحالة "قيد التحضير" (preparing) وتصبح جاهزة لاستلام إيصالات الشراء.

## سير الموافقة

draft → pending_hospital_approval → pending_manager_approval → preparing → complete (أو partially_complete إذا لم تُستلم كل الكميات المعتمدة بعد؛ partially_complete يمكن إكمالها يدوياً لاحقاً بعد أن تُؤكَّد كل الإيصالات).

## قواعد التحقق

- لا يمكن تقديم طلب فارغ بلا عناصر.
- الكمية المعتمدة لكل عنصر (approvedQuantity) لا يمكن أن تتجاوز الكمية المطلوبة (requestedQuantity).
- الإلغاء مسموح فقط في الحالات: draft، pending_hospital_approval، pending_manager_approval.
- تعديل عناصر الطلب مسموح فقط أثناء حالة المسودة (draft).
- الرفض بعد الموافقة النهائية (أثناء preparing) مسموح فقط لنفس المدير الذي وافق على الطلب، وفقط إذا لم يتم إنشاء أي إيصال استلام له بعد.
- إكمال طلب بحالة partially_complete يدوياً مسموح فقط لنفس المدير الذي وافق عليه، وفقط إذا لم تعد هناك إيصالات بانتظار التأكيد.
- كل متغيرات الطلب (والمنتج الأساسي لها) يجب أن تكون نشطة.

## الصلاحيات المطلوبة

create_purchase_request لإنشاء/تعديل/تقديم/إلغاء الطلب. approve_purchase_request_hospital لموافقة/رفض مستوى المستشفى. approve_purchase_request_manager لموافقة/رفض/إكمال مستوى المدير. view_purchasing_history لعرض القائمة والتفاصيل.
