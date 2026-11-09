// Lists every hand-written Vietnamese text next to its English source: scripts/vi-pairs.json [{ file, raw, vi, en }].
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const out = [];
const strOf = (n) => (n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n : null);
function pair(en, vi, file) {
  if (!en || !vi) return;
  if (ts.isAsExpression(en)) en = en.expression; if (ts.isAsExpression(vi)) vi = vi.expression;
  const a = strOf(en), b = strOf(vi);
  if (a && b) { if (/[A-Za-zÀ-ỹ]/.test(b.text)) out.push({ file, raw: b.getText(), vi: b.text, en: a.text }); return; }
  if (ts.isArrayLiteralExpression(en) && ts.isArrayLiteralExpression(vi)) en.elements.forEach((e, i) => pair(e, vi.elements[i], file));
}
function walk(file) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (n) => {
    if (ts.isObjectLiteralExpression(n)) {
      const m = new Map(); n.properties.forEach((p) => { if (ts.isPropertyAssignment(p)) m.set(p.name.getText().replace(/['"]/g, ''), p.initializer); });
      if (m.has('en') && m.has('vi')) pair(m.get('en'), m.get('vi'), path.relative(SRC, file));
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
(function list(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'i18n') list(p); } else if (/\.tsx?$/.test(f)) walk(p); } })(SRC);
fs.writeFileSync(path.join(__dirname, 'vi-pairs.json'), JSON.stringify(out, null, 1));
console.log(out.length, 'pairs');
