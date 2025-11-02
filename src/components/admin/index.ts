// Admin Dashboard Components
export { EntityTable } from "./entity-table";
export type { EntityTableProps, ColumnDef } from "./entity-table";

export { EntityForm, createFormField, createWorkerFormFields, createBuildingFormFields, createApartmentFormFields } from "./entity-form";
export type { EntityFormProps, FormFieldConfig, FieldType, SelectOption } from "./entity-form";

export { 
  ConfirmDialog, 
  DeleteConfirmDialog, 
  UnsavedChangesDialog, 
  CascadeDeleteWarningDialog 
} from "./confirm-dialog";
export type { 
  ConfirmDialogProps, 
  ConfirmDialogVariant,
  DeleteConfirmDialogProps,
  UnsavedChangesDialogProps,
  CascadeDeleteWarningDialogProps
} from "./confirm-dialog";