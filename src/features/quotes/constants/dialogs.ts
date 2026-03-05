export const QUOTE_DIALOGS = {
  MEASURE_IMPORT: 'measureImport',
  EXCEL_IMPORT: 'excelImport',
  ADD_ROOM: 'addRoom',
  SAVE_TEMPLATE: 'saveTemplate',
  REJECT: 'reject',
  APPROVE: 'approve',
} as const;

export type QuoteDialogType = (typeof QUOTE_DIALOGS)[keyof typeof QUOTE_DIALOGS];
