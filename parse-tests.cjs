const fs = require('fs');
const txt = fs.readFileSync('failed-tests.txt', 'utf-8');
const parts = txt.split('"name":"');
const names = new Set();
for (let i = 1; i < parts.length; i++) {
    names.add(parts[i].substring(0, parts[i].indexOf('"')));
}
console.log(Array.from(names).join('\n'));
