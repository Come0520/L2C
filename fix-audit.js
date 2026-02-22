const fs = require('fs');

// Fix mutations.ts
let mutations = fs.readFileSync('src/features/leads/actions/mutations.ts', 'utf8');
mutations = mutations.replace(/await AuditService\.log\(\{\s*tenantId,\s*userId,\s*action:\s*'([^']+)',\s*entityType:\s*'([^']+)',\s*entityId:\s*([^,]+),\s*details:\s*([^}]+)\s*\}\);/g, (match, action, entityType, entityId, details) => {
    return `await AuditService.log(db, {
            tenantId,
            userId,
            tableName: 'leads',
            recordId: ${entityId.trim()},
            action: '${action}',
            newValues: ${details.trim()}
        });`;
});
fs.writeFileSync('src/features/leads/actions/mutations.ts', mutations, 'utf8');

// Fix package-actions.ts
let packageActions = fs.readFileSync('src/features/products/actions/package-actions.ts', 'utf8');
packageActions = packageActions.replace(/await AuditService\.log\(db, \{\s*tenantId,\s*userId:\s*session\.user\.id,\s*action:\s*'([^']+)',\s*entityType:\s*'([^']+)',\s*entityId:\s*([^,]+),\s*details:\s*([^}]+)\s*\}\);/g, (match, action, entityType, entityId, details) => {
    return `await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: ${entityId.trim()},
            action: '${action}',
            newValues: ${details.trim()}
        });`;
});
fs.writeFileSync('src/features/products/actions/package-actions.ts', packageActions, 'utf8');
console.log('Fixed AuditService log calls');
