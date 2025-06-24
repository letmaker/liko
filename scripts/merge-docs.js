const fs = require('node:fs');
const path = require('node:path');

// 读取生成的文档目录
const docsDir = './markdown';
const outputFile = './markdown/liko.md';

// 读取主 README 文件
let content = fs.readFileSync(path.join(docsDir, 'README.md'), 'utf8');

// 读取命名空间文件
const namespaceFiles = fs
  .readdirSync(docsDir)
  .filter((file) => file.startsWith('Namespace.') && file.endsWith('.md'))
  .sort();

// 在主文档末尾添加命名空间内容
for (const file of namespaceFiles) {
  const namespacePath = path.join(docsDir, file);
  const namespaceContent = fs.readFileSync(namespacePath, 'utf8');

  // 添加分隔符和命名空间内容
  content += '\n\n---\n\n';
  content += namespaceContent;
}

// 写入合并后的单文档
fs.writeFileSync(outputFile, content, 'utf8');

console.log(`✅ 文档已合并到 ${outputFile}`);
console.log(`📄 合并了 ${namespaceFiles.length + 1} 个文件`);
