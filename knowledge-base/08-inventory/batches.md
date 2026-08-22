---
feature: batches
module: inventory
doc_type: how_to
platform: web
routes: [/inventory/batches]
requires_permission: view_inventory
requirement_ref: null
actors: [hospital_manager, warehouse_manager]
related_features: [live-stock, transactions]
related_capability: null
related_ui_flows: []
related_glossary: []
tags: [الدفعات, batches, رقم الدفعة, تاريخ الانتهاء, مورد]
last_updated: 2026-08-20
---

# الدفعات (Batches)

## نظرة عامة

صفحة "الدفعات" هي عرض للقراءة فقط لكل دفعات المنتجات المُستلَمة عبر إيصالات الشراء، مع إمكانية الفلترة حسب القسم.

## خطوات التنفيذ - على الويب

1. من صفحة "الدفعات"، استخدم فلتر القسم لعرض دفعات قسم محدد (أو كل الأقسام إن كانت لديك صلاحية وصول غير مقيدة).
2. يعرض الجدول لكل دفعة: رقم الدفعة، المتغير، المورد، الكمية المستلمة، سعر الشراء، تاريخ التصنيع، وتاريخ الانتهاء.
3. تظهر شارة "منتهي الصلاحية" أو "قريب من الانتهاء" بجانب تاريخ الانتهاء حسب الحالة.

## قواعد التحقق

- هذه الصفحة للعرض فقط؛ لا توجد عمليات إنشاء أو تعديل أو حذف للدفعات من هنا (الدفعات تُنشأ تلقائياً فقط عند تأكيد إيصال شراء).

## الصلاحيات المطلوبة

view_inventory مطلوبة لعرض هذه الصفحة.
