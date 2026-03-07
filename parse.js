const fs = require('fs');
const data = JSON.parse(fs.readFileSync('e2e-failed-list.json', 'utf-8'));
const failed = {};

data.errors?.forEach(e => {
    // If there are top level errors
});

data.suites.forEach(s => {
    s.suites?.forEach(fSuite => {
        fSuite.specs?.forEach(sp => {
            sp.tests?.forEach(t => {
                t.results?.forEach(r => {
                    if (r.status === 'failed' || r.status === 'timedOut') {
                        const file = sp.file.replace(/.*(?:\\|\/)e2e(?:\\|\/)/, '');
                        failed[file] = (failed[file] || 0) + 1;
                    }
                });
            });
        });
    });
});

console.log(Object.entries(failed).map(([k, v]) => `| ${k} | ${v} | 待修复 |`).join('\n'));
