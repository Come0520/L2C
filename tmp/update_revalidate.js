const fs = require('fs');
const file = 'C:/Users/bigey/Documents/Antigravity/L2C/src/features/supply-chain/actions/po-actions.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/revalidatePath\(SUPPLY_CHAIN_PATHS\.PURCHASE_ORDERS\);\n(\s*)/g, "revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);\n$1revalidateTag('purchaseOrders');\n$1");
fs.writeFileSync(file, content);
