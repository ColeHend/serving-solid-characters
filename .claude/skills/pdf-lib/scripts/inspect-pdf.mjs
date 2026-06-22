#!/usr/bin/env node
// Inspect a PDF with pdf-lib: page count, page sizes, and every form field
// (type, name, and options for dropdowns/lists).
//
// Usage (run from SolidCharacters/client so `pdf-lib` resolves):
//   node ../../.claude/skills/pdf-lib/scripts/inspect-pdf.mjs <path-to.pdf>
//
// The fastest way to learn how to fill or draw on a template before writing code.
// A field count of 0 means it is a flat PDF — you must draw text at coordinates
// instead of using form.getTextField(...).

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node inspect-pdf.mjs <path-to.pdf>');
  process.exit(1);
}

// Resolve pdf-lib from the CURRENT WORKING DIRECTORY, not this script's location,
// so it works while the script lives under .claude/ but is run from client/.
let PDFDocument;
try {
  const requireFromCwd = createRequire(pathToFileURL(resolve(process.cwd(), 'noop.js')));
  const mod = await import(pathToFileURL(requireFromCwd.resolve('pdf-lib')).href);
  PDFDocument = mod.PDFDocument ?? mod.default?.PDFDocument;
  if (!PDFDocument) throw new Error('PDFDocument export not found');
} catch {
  console.error(
    "Could not resolve 'pdf-lib'. Run this from SolidCharacters/client/ " +
      '(where pdf-lib is installed).',
  );
  process.exit(1);
}

const path = resolve(process.cwd(), arg);
const bytes = await readFile(path);
const doc = await PDFDocument.load(bytes, { updateMetadata: false });

console.log(`File:  ${path}`);
console.log(`Pages: ${doc.getPageCount()}`);
doc.getPages().forEach((p, i) => {
  const { width, height } = p.getSize();
  console.log(`  page ${i}: ${width} x ${height} pt`);
});

const fields = doc.getForm().getFields();
console.log(`\nForm fields: ${fields.length}`);
if (fields.length === 0) {
  console.log('  (flat PDF — no AcroForm fields; use coordinate-based drawText)');
}

const counts = {};
for (const f of fields) {
  const type = f.constructor.name; // PDFTextField, PDFCheckBox, ...
  counts[type] = (counts[type] || 0) + 1;
  let extra = '';
  if (typeof f.getOptions === 'function') {
    try {
      extra = `  opts=${JSON.stringify(f.getOptions())}`;
    } catch {
      /* not an option-bearing field */
    }
  }
  console.log(`  ${type.replace('PDF', '').padEnd(12)} | ${f.getName()}${extra}`);
}

if (fields.length) {
  console.log(`\nBy type: ${JSON.stringify(counts)}`);
}
