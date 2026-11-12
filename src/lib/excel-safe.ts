/** Excel exports must treat all user-controlled values as literal text. */
export function safeExcelText(value: string): string {
  // Spreadsheet apps may interpret formulas after leading whitespace/control chars.
  // Prefixing with an apostrophe forces text display in Excel/LibreOffice.
  return /^[\s\u0000-\u001f]*[=+@\-]/u.test(value) ? "'" + value : value;
}
