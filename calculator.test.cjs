const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const c = require(path.join(root, 'script.js'));
assert.equal(c.perWp(840000000), 0.7);
assert.equal(c.parseAmount('').state, 'empty');
assert.equal(c.parseAmount('  ').state, 'empty');
assert.equal(c.parseAmount('0').cents, 0);
assert.equal(c.parseAmount('0,10').cents, 10);
assert.equal(c.parseAmount('0.20').cents, 20);
assert.equal(c.summarizeCosts(['0,10','0.20','0','0','0'].map(c.parseAmount)).cents, 30);
for (const s of ['-1','abc','1.234,56','1,234.56','1.234','Infinity','1e6','999999999999999999999999']) assert.equal(c.parseAmount(s).state,'invalid', s);
for (const [offer, prefix] of [[839999999,'Por debajo'],[840000000,'Igual'],[840000001,'Por encima']]) assert.ok(c.compareAmounts(offer,840000000).startsWith(prefix));
assert.ok(c.compareAmounts(840000001,840000000).includes('menos de'));
assert.equal(c.summarizeCosts(['0','','','',''].map(c.parseAmount)).complete,false);
assert.equal(c.summarizeCosts(['0','0','0','0','0'].map(c.parseAmount)).complete,true);

const crypto = require("node:crypto");
const expectedFormulaHashes = {"parseAmount": "169a2ee5b32e47eb24c001e60e1e81607aaa64e5a4ed8cc84228b439cab0e44d", "perWp": "1962f392b276c8e6c185eb05dd6bdd6a31544c5ff8b5581a9c34674c6c9f2dec", "compareAmounts": "2d7467f6034089f9b66f9867c5c4e90e47931fa7fbedc403257164cb41b2702d", "summarizeCosts": "1dc5251a3ddc0105a0f8d3c044359adbc9da12bd1439180af1b62aae97ec0369"};
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
for (const [name, expected] of Object.entries(expectedFormulaHashes)) {
  const body = source.match(new RegExp('function ' + name + '\\([^\\n]*\\) \\{[\\s\\S]*?\\n\\}'))?.[0];
  assert.ok(body, name);
  assert.equal(crypto.createHash('sha256').update(body.replace(/\r\n/g, '\n')).digest('hex'), expected, 'Existing formula unchanged: ' + name);
}
const empty = { modules:'', inverters:'', structure:'', civil:'', other:'', offer:'' };
const summary = c.buildCommitteeSummary(empty);
assert.ok(summary.includes('12 MWp (12.000.000 Wp)'));
assert.ok(summary.includes('8.400.000,00') && summary.includes('0,70 €/Wp'));
for (const label of ['Módulos','Inversores','Estructura','Obra civil','Otros','Precio de oferta','Coste total','Oferta frente al coste total','Oferta frente al presupuesto base']) assert.ok(summary.includes(label + ': pendiente'),label);
const zero = Object.fromEntries(Object.keys(empty).map(k=>[k,'0']));
assert.ok(c.buildCommitteeSummary(zero).includes('Precio de oferta: 0,00'));
assert.ok(c.buildCommitteeSummary(zero).includes('Oferta frente al coste total: Igual'));
const partial = c.buildCommitteeSummary({...empty,modules:'0,10',inverters:'0.20',offer:'8400000'});
assert.ok(partial.includes('Suma parcial (2/5 partidas; total pendiente): 0,30'));
assert.ok(partial.includes('Oferta frente al coste total: pendiente'));
assert.ok(partial.includes('Oferta frente al presupuesto base: Igual'));
assert.ok(c.buildCommitteeSummary({...empty,modules:'-1'}).includes('Módulos: pendiente (importe inválido)'));
for(const [offer,direction] of [['8399999.99','Por debajo'],['8400000','Igual'],['8400000.01','Por encima']]) {
  const text=c.buildCommitteeSummary({...zero,modules:'8400000',offer});
  assert.ok(text.includes('Oferta frente al coste total: '+direction));
  assert.ok(text.includes('Oferta frente al presupuesto base: '+direction));
}
for (const text of [summary,partial,c.buildCommitteeSummary(zero)]) {
  assert.ok(!/recom|sugier|margen|deber[ií]a|conviene/i.test(text));
  assert.ok(!/NaN|Infinity|undefined/.test(text));
  assert.ok(text.split('\n').length <= 13);
}
console.log('PASS: previous arithmetic tests; summary empty, partial, complete, zero, invalid, comparisons; original formulas unchanged.');
