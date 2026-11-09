// Collects every English UI text (objects with an `en` key) and, for each language, the texts that have no hand-written translation.
// Output: scripts/i18n-need.json  { "<lang>": ["English text", ...] }. Used by i18n-translate.py to build src/i18n/<lang>.json.
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const LANGS = ['zh', 'vi', 'id', 'ja', 'ko', 'es', 'fr', 'de'];
const need = Object.fromEntries(LANGS.map((l) => [l, new Set()]));
const skip = (s) => !s.trim() || /^(\/|https?:|#)/.test(s) || !/[A-Za-z]/.test(s);

function leaves(node, out, key) {
  if (!node) return;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) { if (key !== 'id' && !skip(node.text)) out.push(node.text); return; }
  if (ts.isArrayLiteralExpression(node)) { node.elements.forEach((e) => leaves(e, out)); return; }
  if (ts.isObjectLiteralExpression(node)) { node.properties.forEach((p) => { if (ts.isPropertyAssignment(p)) leaves(p.initializer, out, p.name.getText().replace(/['"]/g, '')); }); return; }
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression?.(node)) leaves(node.expression, out, key);
}

function walk(file) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (n) => {
    if (ts.isObjectLiteralExpression(n)) {
      const props = new Map();
      n.properties.forEach((p) => { if (ts.isPropertyAssignment(p)) props.set(p.name.getText().replace(/['"]/g, ''), p.initializer); });
      if (props.has('en') && (props.has('zh') || props.has('vi') || props.size === 1 || [...props.keys()].every((k) => ['en', ...LANGS].includes(k)))) {
        const out = []; leaves(props.get('en'), out);
        for (const l of LANGS) if (!props.has(l)) out.forEach((s) => need[l].add(s));
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
const files = [];
(function list(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'i18n') list(p); } else if (/\.(tsx?)$/.test(f)) files.push(p); } })(SRC);
files.forEach(walk);
const res = Object.fromEntries(LANGS.map((l) => [l, [...need[l]].sort()]));
fs.writeFileSync(path.join(__dirname, 'i18n-need.json'), JSON.stringify(res, null, 1));
for (const l of LANGS) console.log(l, res[l].length, 'texts,', res[l].reduce((a, s) => a + s.length, 0), 'chars');
