import { Project, SyntaxKind } from 'ts-morph';

async function main() {
    const project = new Project({
        tsConfigFilePath: './tsconfig.json',
    });

    const filesToRefactor = [
        'src/app/api/miniprogram/upload/route.ts',
        'src/app/api/miniprogram/tenant/status/route.ts',
        'src/app/api/miniprogram/tenant/payment-config/route.ts',
        'src/app/api/miniprogram/tasks/[id]/route.ts',
        'src/app/api/miniprogram/tasks/[id]/negotiate/route.ts',
        'src/app/api/miniprogram/tasks/[id]/measure-verify/route.ts',
        'src/app/api/miniprogram/tasks/route.ts',
        'src/app/api/miniprogram/payment/config/route.ts',
        'src/app/api/miniprogram/log/error/route.ts',
        'src/app/api/miniprogram/invite/list/route.ts',
        'src/app/api/miniprogram/engineer/schedule/route.ts',
        'src/app/api/miniprogram/invite/generate/route.ts',
    ];

    for (const filePath of filesToRefactor) {
        let sourceFile = project.getSourceFile(filePath);
        if (!sourceFile) {
            sourceFile = project.addSourceFileAtPath(filePath);
        }

        let modified = false;

        // Fix imports
        const authImport = sourceFile.getImportDeclaration(decl => {
            return decl.getModuleSpecifierValue().includes('auth-utils');
        });

        if (authImport) {
            const namedImports = authImport.getNamedImports();
            const hasGetMiniprogramUser = namedImports.some(i => i.getName() === 'getMiniprogramUser');
            if (hasGetMiniprogramUser) {
                let hasWithAuth = false;
                namedImports.forEach(i => {
                    if (i.getName() === 'withMiniprogramAuth') hasWithAuth = true;
                });

                const importSpecifier = namedImports.find(i => i.getName() === 'getMiniprogramUser');
                if (importSpecifier) importSpecifier.remove();

                if (!hasWithAuth) {
                    authImport.addNamedImport('withMiniprogramAuth');
                }
                modified = true;
            }
        }

        // Wrap functions
        const exportedFunctions = sourceFile.getFunctions().filter(f => f.isExported() && f.isAsync());
        for (const func of exportedFunctions) {
            const name = func.getName();
            if (!name || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(name)) continue;

            if (!func.getText().includes('getMiniprogramUser')) continue;

            const userDecl = func.getVariableStatement(v => v.getText().includes('getMiniprogramUser(request)'));
            if (userDecl) userDecl.remove();

            const returnUnauthList = func.getStatements().filter(s => s.getKind() === SyntaxKind.IfStatement && s.getText().includes('!user'));
            returnUnauthList.forEach(s => s.remove());

            const cleanBody = func.getBodyText();

            const params = func.getParameters();
            let newParamsStr = '';
            if (params.length === 0) {
                newParamsStr = 'request: NextRequest, user';
            } else if (params.length === 1) {
                newParamsStr = `${params[0].getText()}, user`;
            } else {
                newParamsStr = `${params[0].getText()}, user, ${params.slice(1).map(p => p.getText()).join(', ')}`;
            }

            const wrapperCall = `export const ${name} = withMiniprogramAuth(async (${newParamsStr}) => {\n${cleanBody}\n});\n`;

            func.replaceWithText(wrapperCall);
            modified = true;
            console.log(`Refactored ${name} in ${filePath}`);
        }

        if (modified) {
            sourceFile.saveSync();
            console.log(`Saved ${filePath}`);
        }
    }
}

main().catch(console.error);
