const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/bigey/Documents/Antigravity/L2C/src/features/analytics/actions';
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.ts')) {
        const p = path.join(dir, file);
        let c = fs.readFileSync(p, 'utf8');
        const oldContent = ')().then(data => ({ success: true, data }));';
        if (c.includes(oldContent)) {
            c = c.replace(oldContent, ')();');
            fs.writeFileSync(p, c);
            console.log('Fixed', file);
        }
    }
});
