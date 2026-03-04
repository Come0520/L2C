const fs = require('fs');
let code = fs.readFileSync('src/app/api/miniprogram/auth-utils.ts', 'utf8');
code = code.replace(
  'export async function generateMiniprogramToken(\r\n  userId: string,\r\n  tenantId: string,\r\n  options?: {\r\n    /** Token 类型标识，默认 \'miniprogram\' */\r\n    type?: string;\r\n    /** 过期时间，默认 \'7d\' */\r\n    expiresIn?: string;\r\n  }\r\n)',
  'export async function generateMiniprogramToken(\r\n  userId: string,\r\n  tenantId: string,\r\n  role: string,\r\n  options?: {\r\n    /** Token 类型标识，默认 \'miniprogram\' */\r\n    type?: string;\r\n    /** 过期时间，默认 \'7d\' */\r\n    expiresIn?: string;\r\n    phone?: string;\r\n  }\r\n)'
);
code = code.replace(
  'const token = await new SignJWT({\r\n    userId,\r\n    tenantId,\r\n    type,\r\n  })',
  'const token = await new SignJWT({\r\n    userId,\r\n    tenantId,\r\n    role,\r\n    type,\r\n    phone: options?.phone,\r\n  })'
);
code = code.replace(
  'logger.info(\'[Auth] Token 已签发\', {\r\n    route: \'auth-utils\',\r\n    userId,\r\n    tenantId,\r\n    type,\r\n    expiresIn,\r\n  });',
  'logger.info(\'[Auth] Token 已签发\', {\r\n    route: \'auth-utils\',\r\n    userId,\r\n    tenantId,\r\n    role,\r\n    type,\r\n    expiresIn,\r\n  });'
);
fs.writeFileSync('src/app/api/miniprogram/auth-utils.ts', code);
console.log('Done!');

