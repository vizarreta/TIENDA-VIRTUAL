const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createRequire } = require('node:module');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

// TypeScript compilation is checked separately by tsc; this loader isolates browser dependencies.
module.exports = function loadTypescript(file, { globals = {}, imports = {}, env = {} } = {}) {
  const filename = resolve(file);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: filename,
    transformers: {
      before: [
        (context) => (source) => {
          const visit = (node) => {
            if (ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword) {
              return ts.factory.createIdentifier('__viteImportMeta');
            }
            return ts.visitEachChild(node, visit, context);
          };
          return ts.visitNode(source, visit);
        },
      ],
    },
  });
  const exports = {};
  const requireFromFile = createRequire(filename);
  runInNewContext(
    outputText,
    {
      exports,
      __viteImportMeta: { env },
      require: (name) => (Object.hasOwn(imports, name) ? imports[name] : requireFromFile(name)),
      ...globals,
    },
    { filename }
  );
  return exports;
};
