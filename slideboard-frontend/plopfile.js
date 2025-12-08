// plopfile.js
module.exports = function (plop) {
  // Feature 生成器
  plop.setGenerator('feature', {
    description: 'Generate a new feature module',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Feature name (kebab-case):',
        validate: (value) => {
          if (/^[a-z]+(-[a-z]+)*$/.test(value)) {
            return true;
          }
          return 'Please use kebab-case format (e.g., my-feature)';
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Feature description:',
      },
    ],
    actions: [
      // 创建基础目录结构
      {
        type: 'add',
        path: 'src/features/{{name}}/index.ts',
        templateFile: 'plop-templates/feature/index.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{name}}/types.ts',
        templateFile: 'plop-templates/feature/types.hbs',
      },
      // 创建组件目录和示例组件
      {
        type: 'add',
        path: 'src/features/{{name}}/components/{{properCase name}}Card.tsx',
        templateFile: 'plop-templates/feature/component.hbs',
      },
      // 创建测试文件
      {
        type: 'add',
        path: 'src/features/{{name}}/components/__tests__/{{properCase name}}Card.test.tsx',
        templateFile: 'plop-templates/feature/component.test.hbs',
      },
      // 创建组件索引文件
      {
        type: 'add',
        path: 'src/features/{{name}}/components/index.ts',
        templateFile: 'plop-templates/feature/components-index.hbs',
      },
    ],
  });

  // Service 生成器
  plop.setGenerator('service', {
    description: 'Generate a new service module',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Service name (kebab-case):',
        validate: (value) => {
          if (/^[a-z]+(-[a-z]+)*$/.test(value)) {
            return true;
          }
          return 'Please use kebab-case format (e.g., my-service)';
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Service description:',
      },
    ],
    actions: [
      // 创建服务客户端文件
      {
        type: 'add',
        path: 'src/services/{{name}}.client.ts',
        templateFile: 'plop-templates/service/client.hbs',
      },
      // 创建测试文件
      {
        type: 'add',
        path: 'src/services/__tests__/{{name}}.client.test.ts',
        templateFile: 'plop-templates/service/client.test.hbs',
      },
    ],
  });
};
