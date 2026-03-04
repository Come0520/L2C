import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';

async function main() {
    console.log('开始重构硬编码的 apiError 状态码...');
    const project = new Project({
        tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    });

    const sourceFiles = project.getSourceFiles('src/app/api/**/*.ts');
    let totalReplacements = 0;

    for (const sourceFile of sourceFiles) {
        let changed = false;

        // 获取文件中所有的函数调用表达式
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

        for (const callExpr of callExpressions) {
            const expression = callExpr.getExpression();
            if (expression.getText() === 'apiError') {
                const args = callExpr.getArguments();

                // 如果是 apiError(msg, 400)
                if (args.length >= 2) {
                    const codeArg = args[1];
                    if (codeArg.getKind() === SyntaxKind.NumericLiteral) {
                        const numValue = codeArg.getText();
                        if (numValue === '400') {
                            // 替换为 apiBadRequest(msg)
                            expression.replaceWithText('apiBadRequest');
                            if (args.length === 2) {
                                callExpr.removeArgument(1); // 移除状态码参数
                            }
                            changed = true;
                            totalReplacements++;
                        } else if (numValue === '500') {
                            // 替换为 apiServerError(msg)
                            expression.replaceWithText('apiServerError');
                            if (args.length === 2) {
                                callExpr.removeArgument(1);
                            }
                            changed = true;
                            totalReplacements++;
                        } else if (numValue === '404') {
                            expression.replaceWithText('apiNotFound');
                            if (args.length === 2) {
                                callExpr.removeArgument(1);
                            }
                            changed = true;
                            totalReplacements++;
                        } else if (numValue === '403') {
                            expression.replaceWithText('apiForbidden');
                            if (args.length === 2) {
                                callExpr.removeArgument(1);
                            }
                            changed = true;
                            totalReplacements++;
                        } else if (numValue === '401') {
                            expression.replaceWithText('apiUnauthorized');
                            if (args.length === 2) {
                                callExpr.removeArgument(1);
                            }
                            changed = true;
                            totalReplacements++;
                        }
                    }
                }
            }
        }

        if (changed) {
            // 确保导入了必要的便捷方法
            const importDecls = sourceFile.getImportDeclarations();
            const apiResponseImport = importDecls.find(decl => decl.getModuleSpecifierValue().includes('api-response'));

            if (apiResponseImport) {
                const namedImports = apiResponseImport.getNamedImports().map(i => i.getName());
                const currentText = sourceFile.getFullText();

                ['apiBadRequest', 'apiServerError', 'apiNotFound', 'apiForbidden', 'apiUnauthorized'].forEach(helper => {
                    if (currentText.includes(helper) && !namedImports.includes(helper)) {
                        apiResponseImport.addNamedImport(helper);
                    }
                });

                // 是否不再需要 apiError？如果本文件没有 apiError() 调用了，可以移除
                if (!currentText.includes('apiError(') && namedImports.includes('apiError')) {
                    const importSpec = apiResponseImport.getNamedImports().find(i => i.getName() === 'apiError');
                    if (importSpec) importSpec.remove();
                }
            }

            sourceFile.saveSync();
            console.log(`Updated ${sourceFile.getFilePath()}`);
        }
    }

    console.log(`\\n重构完成！共计替换了 ${totalReplacements} 处硬编码调用。`);
}

main().catch(console.error);
