import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';

const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
});

const ROOT = 'src/app/api/miniprogram';

const ROUTES_CONFIG = [
    { prefix: 'engineer', roles: ["'WORKER'"] },
    { prefix: 'sales', roles: ["'SALES'", "'MANAGER'", "'ADMIN'"] },
    { prefix: 'leads', roles: ["'SALES'", "'MANAGER'", "'ADMIN'"] },
    { prefix: 'orders', roles: ["'SALES'", "'MANAGER'", "'ADMIN'", "'CUSTOMER'"] },
    { prefix: 'customers', roles: ["'SALES'", "'MANAGER'", "'ADMIN'"] },
    { prefix: 'crm', roles: ["'SALES'", "'MANAGER'", "'ADMIN'"] },
    { prefix: 'quotes', roles: ["'SALES'", "'MANAGER'", "'ADMIN'", "'CUSTOMER'"] },
    { prefix: 'tasks', roles: ["'WORKER'", "'SALES'", "'MANAGER'", "'ADMIN'"] },
];

const IGNORE_DIRS = ['auth', '__tests__', 'invite', 'tenant', 'config', 'payment'];

const sourceFiles = project.getSourceFiles(`${ROOT}/**/route.ts`);

let changed = 0;

for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(path.resolve(ROOT), path.resolve(filePath)).replace(/\\/g, '/');

    const rootDirName = relativePath.split('/')[0];
    if (IGNORE_DIRS.includes(rootDirName)) {
        continue;
    }

    let hasAuthImport = false;
    let getMiniprogramUserImported = false;

    const imports = sourceFile.getImportDeclarations();
    let authUtilsImport = null;
    for (const imp of imports) {
        if (imp.getModuleSpecifierValue().includes('auth-utils')) {
            authUtilsImport = imp;
            for (const named of imp.getNamedImports()) {
                if (named.getName() === 'getMiniprogramUser') {
                    hasAuthImport = true;
                    getMiniprogramUserImported = true;
                    named.remove(); // Safely remove just this named import
                }
            }
        }
        // Also support if they were using requireWorker from middleware
        if (imp.getModuleSpecifierValue().includes('middleware')) {
            for (const named of imp.getNamedImports()) {
                if (named.getName() === 'requireWorker') {
                    hasAuthImport = true;
                    named.remove();
                }
            }
        }
    }

    if (!hasAuthImport) {
        continue;
    }

    // Ensure withMiniprogramAuth is imported
    if (!authUtilsImport) {
        // We removed requireWorker from middleware, so we must add import for withMiniprogramAuth
        sourceFile.addImportDeclaration({
            namedImports: ['withMiniprogramAuth'],
            moduleSpecifier: getMiniprogramUserImported ? '../../auth-utils' : '@/app/api/miniprogram/auth-utils'
        });
    } else {
        const hasWrapper = authUtilsImport.getNamedImports().some(n => n.getName() === 'withMiniprogramAuth');
        if (!hasWrapper) {
            authUtilsImport.addNamedImport('withMiniprogramAuth');
        }
    }

    let roles: string[] = [];
    for (const conf of ROUTES_CONFIG) {
        if (relativePath.startsWith(conf.prefix + '/')) {
            roles = conf.roles;
            break;
        }
    }

    const roleArg = roles.length ? `[${roles.join(', ')}]` : '';

    let fileModified = false;

    const functions = sourceFile.getFunctions().filter(f => f.isExported() && f.isAsync());

    for (const func of functions) {
        const name = func.getName();
        if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(name || '')) continue;

        fileModified = true;

        // We do text replacement on the body text so we don't destroy AST unexpectedly
        let bodyText = func.getBodyText() || '';

        // Remove getMiniprogramUser checks
        bodyText = bodyText.replace(/const\s+user\s*=\s*await\s+getMiniprogramUser\([^)]+\);?/g, '');
        bodyText = bodyText.replace(/if\s*\(!user\)\s*\{\s*return\s+apiError\([^)]+\);?\s*\}/g, '');
        bodyText = bodyText.replace(/if\s*\(!user\)\s*return\s+apiError\([^)]+\);?/g, '');

        // Remove requireWorker checks
        bodyText = bodyText.replace(/const\s+auth\s*=\s*await\s+requireWorker\([^)]+\);?/g, '');
        bodyText = bodyText.replace(/if\s*\(!auth\.success\)\s*return\s+auth\.response;?/g, '');
        bodyText = bodyText.replace(/const\s+\{\s*user\s*\}\s*=\s*auth;?/g, '');

        const params = func.getParameters().map(p => p.getText());
        const methodParams = [];
        if (params.length > 0) methodParams.push(params[0]);
        methodParams.push('user');
        if (params.length > 1) methodParams.push(params[1]);

        const newDeclText = `export const ${name} = withMiniprogramAuth(async (${methodParams.join(', ')}) => {\n${bodyText}\n}${roleArg ? `, ${roleArg}` : ''});`;

        func.replaceWithText(newDeclText);
    }

    if (fileModified) {
        sourceFile.saveSync();
        changed++;
        console.log(`Updated ${relativePath}`);
    }
}

console.log(`Total changed via ts-morph: ${changed}`);
