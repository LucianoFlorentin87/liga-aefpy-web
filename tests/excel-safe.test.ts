import assert from "node:assert/strict";
import { test } from "node:test";
import { safeExcelText } from "../src/lib/excel-safe";

test("escapes spreadsheet formulas and prefixed formulas", () => {
  for (const value of ["=1+1", "+SUM(A1:A2)", "-2+3", "@SUM(A1)", "  =HYPERLINK(1)", "\t=1+1", "\n+cmd"]) {
    assert.equal(safeExcelText(value), "'" + value);
  }
});

test("preserves safe values", () => {
  for (const value of ["Milan Py", "delegado@liga.test", "2026-11-12", "10", ""] ) {
    assert.equal(safeExcelText(value), value);
  }
});
