---
feature: transactions
module: inventory
doc_type: how_to
platform: web
routes: [/inventory/transactions]
requires_permission: view_inventory
requirement_ref: null
actors: [hospital_manager, warehouse_manager]
related_features: [live-stock, adjustments, batches]
related_capability: null
related_ui_flows: []
related_glossary: []
tags: [الحركات, transactions, سجل المخزون, ledger]
last_updated: 2026-08-20
---

# سجل حركات المخزون (Transactions)

## نظرة عامة

صفحة "الحركات" تعرض سجلاً كاملاً للقراءة فقط لكل حركة أثّرت على كمية المخزون في أي قسم، بغض النظر عن مصدرها (استلام، تحويل، صرف، استهلاك، تسوية).

## خطوات التنفيذ - على الويب

1. من صفحة "الحركات"، استخدم فلاتر القسم ونوع الحركة لتضييق النتائج.
2. يعرض الجدول لكل حركة: التاريخ، النوع، المتغير، القسم، الدفعة، الكمية (موجبة أو سالبة)، والرصيد بعد الحركة.

## قواعد التحقق

أنواع الحركات الممكنة: purchase_receipt (استلام مشتريات)، department_transfer_out (تحويل صادر)، department_transfer_in (تحويل وارد)، prescription_dispense (صرف وصفة)، department_consumption (استهلاك قسم)، adjustment_damaged، adjustment_expired، adjustment_shrinkage، adjustment_found، disposal_transfer_out، disposal_transfer_in، disposal_sale_out. هذا السجل للعرض فقط؛ لا يمكن تعديل أو حذف أي حركة منه — كل حركة تُنشأ تلقائياً كنتيجة جانبية لعملية أخرى في النظام.

## الصلاحيات المطلوبة

view_inventory مطلوبة لعرض هذه الصفحة.
