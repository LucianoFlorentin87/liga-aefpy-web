import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("red and yellow cards use football semantic tokens, never branding", () => {
  const icon = read("src/components/CardIcon.tsx");
  const table = read("src/components/DisciplineTable.tsx");
  const widget = read("src/components/DisciplineWidget.tsx");
  const css = read("src/app/globals.css");
  assert.match(icon, /text-\[var\(--football-card-red\)\]/);
  assert.match(icon, /text-\[var\(--football-card-yellow\)\]/);
  assert.doesNotMatch(icon, /color-red-accent|text-yellow-500/);
  assert.match(table, /football-card-red/);
  assert.match(table, /<CardIcon color="red"/);
  assert.match(widget, /<CardIcon color="red"/);
  assert.match(css, /--football-card-red:\s*#ef3340/i);
  assert.match(css, /--football-card-yellow:\s*#eab308/i);
  assert.match(css, /\.league-site \.badge-red/);
  assert.match(css, /\.admin-arena \.badge-red/);
});
