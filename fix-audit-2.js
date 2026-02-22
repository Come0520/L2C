const fs = require('fs');

function fixMutations() {
    let content = fs.readFileSync('src/features/leads/actions/mutations.ts', 'utf8');
    content = content.replace(/await AuditService\.log\(\{\s+tenantId:?\s*.*?,?\s+userId:?\s*.*?,?\s+action:[^,]+,\s+entityType:[^,]+,\s+entityId:[^,]+,\s+details:\s*[\s\S]*?\s*\}\);/g, (match) => {
        // Just extract the values
        const actionMatch = match.match(/action:\s*'([^']+)'/);
        const entityIdMatch = match.match(/entityId:\s*([^,]+)/);
        const detailsMatch = match.match(/details:\s*(\{[\s\S]+?\})\s*\}\);/);

        // Also tenantId and userId might be explicit key-value or shorthand
        const tIdMatch = match.match(/tenantId(:\s*([^,]+))?/);
        const uIdMatch = match.match(/userId(:\s*([^,]+))?/);
        const tId = (tIdMatch && tIdMatch[2]) ? tIdMatch[2].trim() : 'tenantId';
        const uId = (uIdMatch && uIdMatch[2]) ? uIdMatch[2].trim() : 'userId';
        const action = actionMatch[1];
        const recordId = entityIdMatch[1].trim();
        const newValues = detailsMatch[1].trim();
        return `await AuditService.log(db, {
            tenantId: ${tId},
            userId: ${uId},
            tableName: 'leads',
            recordId: ${recordId},
            action: '${action}',
            newValues: ${newValues}
        });`;
    });
    fs.writeFileSync('src/features/leads/actions/mutations.ts', content, 'utf8');
}

function fixPackages() {
    let content = fs.readFileSync('src/features/products/actions/package-actions.ts', 'utf8');
    content = content.replace(/await AuditService\.log\(db, \{\s+tenantId,\s+userId:\s*session\.user\.id,\s+action:[^,]+,\s+entityType:[^,]+,\s+entityId:[^,]+,\s+details:\s*[\s\S]*?\s*\}\);/g, (match) => {
        const actionMatch = match.match(/action:\s*'([^']+)'/);
        const entityIdMatch = match.match(/entityId:\s*([^,]+)/);
        const detailsMatch = match.match(/details:\s*(\{[\s\S]+?\})\s*\}\);/);

        const action = actionMatch[1];
        const recordId = entityIdMatch[1].trim();
        const newValues = detailsMatch[1].trim();

        return `await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: ${recordId},
            action: '${action}',
            newValues: ${newValues}
        });`;
    });
    fs.writeFileSync('src/features/products/actions/package-actions.ts', content, 'utf8');
}

fixMutations();
fixPackages();
