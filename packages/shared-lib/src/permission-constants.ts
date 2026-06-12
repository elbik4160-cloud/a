export const PERMISSION_KEYS = [
  "view_phone",
  "view_phone2",
  "view_owner_name",
  "view_national_id",
  "view_price",
  "view_notes",
  "export_data",
  "delete_clients",
  "add_leads",
  "manage_resale",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, { ar: string; en: string }> = {
  view_phone: { ar: "عرض الهاتف", en: "View phone" },
  view_phone2: { ar: "عرض الهاتف 2", en: "View phone 2" },
  view_owner_name: { ar: "عرض اسم المالك", en: "View owner name" },
  view_national_id: { ar: "عرض الرقم القومي", en: "View national ID" },
  view_price: { ar: "عرض السعر", en: "View price" },
  view_notes: { ar: "عرض الملاحظات", en: "View notes" },
  export_data: { ar: "تصدير البيانات", en: "Export data" },
  delete_clients: { ar: "حذف العملاء", en: "Delete clients" },
  add_leads: { ar: "إضافة عملاء", en: "Add leads" },
  manage_resale: { ar: "إدارة الإعادة", en: "Manage resale" },
};

export const AUDIT_ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  LOGIN: { ar: "دخول", en: "Login" },
  ADD_LEAD: { ar: "إضافة عميل", en: "Add Lead" },
  EDIT_LEAD: { ar: "تعديل عميل", en: "Edit Lead" },
  DELETE_LEAD: { ar: "حذف عميل", en: "Delete Lead" },
  ASSIGN_LEAD: { ar: "تكليف", en: "Assign" },
  BULK_ASSIGN: { ar: "تكليف جماعي", en: "Bulk Assign" },
  IMPORT_LEADS: { ar: "استيراد عملاء", en: "Import Leads" },
  BULK_IMPORT: { ar: "استيراد ملف", en: "Bulk Import" },
  ADD_ACTIVITY: { ar: "إضافة نشاط", en: "Add Activity" },
  DELAY_LEAD: { ar: "تأجيل", en: "Delay" },
  ADD_RESALE: { ar: "إضافة وحدة", en: "Add Resale" },
  ASSIGN_RESALE: { ar: "تكليف وحدة", en: "Assign Resale" },
  DELETE_RESALE: { ar: "حذف وحدة", en: "Delete Resale" },
  PERMISSION_CHANGE: { ar: "تغيير صلاحية", en: "Permission Change" },
  EXPORT_DATA: { ar: "تصدير بيانات", en: "Export Data" },
  ADD_COMMENT: { ar: "إضافة تعليق", en: "Add Comment" },
  DELETE_USER: { ar: "حذف مستخدم", en: "Delete User" },
};
