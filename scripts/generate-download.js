// scripts/generate-download.js
const fs = require('fs');
const path = require('path');
const { stat } = require('fs/promises');
// 新增：引入 Node.js 内置 crypto 模块用于计算 MD5（无需安装依赖）
const crypto = require('crypto');

// 配置项（可根据需要修改）
const CONFIG = {
  // 待扫描的文件目录（相对于脚本所在目录）
  scanDir: path.join(__dirname, '../download/doc'),
  // 生成的HTML文件路径（相对于脚本所在目录）
  outputHtml: path.join(__dirname, '../download/download.html'),
  // GitHub仓库的raw文件根路径（替换为你的仓库地址，格式：https://github.com/用户名/仓库名/raw/分支名）
  rawBaseUrl: 'https://github.com/stickpot/stickpot.github.io/raw/main',
  // TXT文件专属的固定下载根域名（可直接在这里修改，无需改后续逻辑）
  txtBaseUrl: 'https://stickpot.github.io/download/doc',
  // 页面标题
  pageTitle: '资源下载站 - 自动生成',
  // 忽略的文件/目录（正则，无需修改）
  ignore: /^\./ // 忽略隐藏文件（如.gitkeep、.DS_Store）
};

// 格式化文件大小（字节转KB/MB/GB）
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  else if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  else return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// 格式化时间（YYYY-MM-DD HH:mm:ss）
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}
// ==================== 新增：计算文件 MD5 值函数 ====================
/**
 * 计算指定文件的 MD5 哈希值
 * @param {string} filePath - 文件完整路径
 * @returns {Promise<string>} 32位小写 MD5 字符串
 */
async function getFileMD5(filePath) {
  return new Promise((resolve, reject) => {
    // 创建 MD5 哈希对象
    const hash = crypto.createHash('md5');
    // 创建文件读取流（适合大文件，不会占用过多内存）
    const stream = fs.createReadStream(filePath);

    // 监听数据流，更新哈希值
    stream.on('data', (chunk) => hash.update(chunk));
    // 读取完成，输出最终 MD5（转小写）
    stream.on('end', () => resolve(hash.digest('hex')));
    // 读取失败则抛出错误
    stream.on('error', (err) => reject(err));
  });
}
// 递归扫描目录，获取所有文件信息
async function scanFiles(dir, relativePath = '') {
  const files = [];
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    // 忽略隐藏文件/目录
    if (CONFIG.ignore.test(dirent.name)) continue;

    const fullPath = path.join(dir, dirent.name);
    const fileRelativePath = path.join(relativePath, dirent.name);

    if (dirent.isDirectory()) {
      // 递归扫描子目录
      const subFiles = await scanFiles(fullPath, fileRelativePath);
      files.push(...subFiles);
    } else {
      // 获取文件状态（大小、修改时间）
      const stats = await stat(fullPath);
      const md5 = await getFileMD5(fullPath);
      files.push({
        name: dirent.name, // 文件名
        relativePath: fileRelativePath, // 相对于doc的路径（用于生成链接）
        size: formatFileSize(stats.size), // 格式化后的大小
        mtime: formatTime(stats.mtimeMs), // 格式化后的修改时间
        md5: md5// 新增：文件 MD5 值
      });
    }
  }

  return files;
}

// 生成HTML内容
function generateHtml(files) {
  // 生成文件列表的HTML行
  const fileListHtml = files.length
    ? files
        .map(file => {
          // 判断是否为TXT文件（后缀名严格匹配.txt）
          const isTxtFile = path.extname(file.name).toLowerCase() === '.txt';
          let downloadLink = '';

          if (isTxtFile) {
            // TXT文件：固定域名链接 + 动态文件名 + download属性
            const txtFileUrl = `${CONFIG.txtBaseUrl}/${encodeURIComponent(file.relativePath)}`;
            downloadLink = `<a href="${txtFileUrl}" class="download-btn" download="${file.name}">点击下载</a>`;
          } else {
            // 非TXT文件：保留原GitHub Raw逻辑
            downloadLink = `<a href="${CONFIG.rawBaseUrl}/download/doc/${encodeURIComponent(file.relativePath)}" target="_blank" class="download-btn">立即下载</a>`;
          }

          // 拼接最终的tr行
          return `
            <tr>
              <td>${file.name}</td>
              <td>${file.size}</td>
              <td class="md5-col">${file.md5}</td>
              <td>${file.mtime}</td>
              <td>${downloadLink}</td>
            </tr>
          `;
        })
        .join('')
    : '<tr><td colspan="4" class="empty">暂无下载文件</td></tr>';

  // 完整HTML模板（带基础样式，自适应移动端）
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CONFIG.pageTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; background: #f5f7fa; }
    h1 { text-align: center; color: #2c3e50; margin-bottom: 2rem; font-size: 1.8rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #3498db; color: #fff; font-weight: 500; }
    tr:hover { background: #f8f9fa; }
    .md5-col { font-family: "Consolas", "Monaco", monospace; font-size: 0.9rem; color: #e67e22; word-break: break-all; }
    .download-btn { display: inline-block; padding: 0.4rem 0.8rem; background: #2ecc71; color: #fff; text-decoration: none; border-radius: 4px; transition: background 0.3s; }
    .download-btn:hover { background: #27ae60; }
    .empty { text-align: center; color: #95a5a6; font-style: italic; }
    .footer { text-align: center; margin-top: 2rem; color: #7f8c8d; font-size: 0.9rem; }
    @media (max-width: 768px) { th, td { padding: 0.8rem 0.5rem; } h1 { font-size: 1.5rem; } }
  </style>
</head>
<body>
  <h1>${CONFIG.pageTitle}</h1>
  <table>
    <thead>
      <tr>
        <th>文件名称</th>
        <th>文件大小</th>
        <th>MD5 值</th>
        <th>最后更新</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${fileListHtml}
    </tbody>
  </table>
  <div class="footer">
    页面由GitHub Actions自动生成 | 最后生成时间：${formatTime(Date.now())}
  </div>
</body>
</html>`;
}

// 主执行函数
async function main() {
  try {
    // 1. 检查扫描目录是否存在，不存在则创建
    if (!fs.existsSync(CONFIG.scanDir)) {
      fs.mkdirSync(CONFIG.scanDir, { recursive: true });
      console.log(`✅ 创建扫描目录：${CONFIG.scanDir}`);
    }

    // 2. 扫描文件
    console.log(`🔍 开始扫描目录：${CONFIG.scanDir}`);
    const files = await scanFiles(CONFIG.scanDir);
    console.log(`✅ 扫描完成，共发现 ${files.length} 个文件`);

    // 3. 生成HTML内容
    const htmlContent = generateHtml(files);

    // 4. 写入HTML文件（创建上级目录如果不存在）
    const outputDir = path.dirname(CONFIG.outputHtml);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.outputHtml, htmlContent, 'utf-8');
    console.log(`✅ HTML文件生成成功：${CONFIG.outputHtml}`);

  } catch (error) {
    console.error('❌ 生成HTML失败：', error.message);
    process.exit(1); // 退出并返回错误码，让Actions感知失败
  }
}

// 执行主函数
main();