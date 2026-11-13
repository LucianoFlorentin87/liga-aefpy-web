import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const root = "src/";

test("AEFPY primary buttons share one official admin style", () => {
  const css = read(root + "app/globals.css");
  assert.match(css, /\.admin-arena \.btn-primary\s*\{[^}]*#d1ff3b/i);
  assert.match(css, /\.admin-arena \.btn-primary:hover\s*\{[^}]*#e0ff82/i);
  const form = read(root + "app/admin/(protected)/reglamento/RegulationUploadForm.tsx");
  assert.match(form, /className="btn btn-primary"/);
  assert.match(form, /className="input"/);
  assert.doesNotMatch(form, /bg-green-600|bg-red-600|bg-\[var\(--color-navy-950\)\]/);
  const committee = read(root + "app/admin/(protected)/comite/page.tsx");
  assert.match(committee, /const button = 'btn btn-primary'/);
  assert.match(committee, /const input = 'input'/);
});

test("maintenance view retains official brand and arena theme", () => {
  const layout = read(root + "app/(public)/layout.tsx");
  assert.match(layout, /if \(settings\?\.maintenanceMode\)/);
  assert.match(layout, /className="league-site/);
  assert.match(layout, /<Logo size=\{38\}/);
  assert.match(layout, /settings\.maintenanceMessage/);
  assert.match(layout, /--arena-accent/);
});

test("delegate inbox uses supported button and status styles", () => {
  const inbox = read(root + "app/admin/(protected)/notificaciones/page.tsx");
  assert.doesNotMatch(inbox, /btn-secondary|bg-red-600|border-red-600/);
  assert.match(inbox, /btn btn-outline/);
  assert.match(inbox, /badge badge-green/);
});

test("public header uses AEFPY accent, not legacy red action", () => {
  const header = read(root + "components/PublicHeader.tsx");
  assert.match(header, /bg-\[var\(--arena-accent\)\]/);
  assert.doesNotMatch(header, /bg-\[var\(--color-red-600\)\]/);
});
