import assert from "node:assert/strict";
import { test } from "node:test";
import { validateImageSignature, validatePdfSignature } from "../src/lib/upload-signatures";

function file(bytes: number[], type: string): File {
  return new File([new Uint8Array(bytes)], "sample", { type });
}

test("accepts PNG, JPEG and WEBP signatures with matching MIME", async () => {
  await assert.doesNotReject(validateImageSignature(file([137,80,78,71,13,10,26,10], "image/png")));
  await assert.doesNotReject(validateImageSignature(file([255,216,255,224], "image/jpeg")));
  await assert.doesNotReject(validateImageSignature(file([82,73,70,70,0,0,0,0,87,69,66,80], "image/webp")));
});

test("rejects MIME spoofing and unsupported SVG", async () => {
  await assert.rejects(validateImageSignature(file([60,115,118,103,62], "image/png")));
  await assert.rejects(validateImageSignature(file([137,80,78,71,13,10,26,10], "image/jpeg")));
  await assert.rejects(validateImageSignature(file([60,115,118,103,62], "image/svg+xml")));
});

test("accepts PDF header and rejects incorrect header", async () => {
  await assert.doesNotReject(validatePdfSignature(file([37,80,68,70,45,49,46,55], "application/pdf")));
  await assert.rejects(validatePdfSignature(file([60,104,116,109,108], "application/pdf")));
});
