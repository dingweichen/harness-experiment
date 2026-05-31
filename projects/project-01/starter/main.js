const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 获取应用数据目录（本地数据目录）
const DATA_DIR = path.join(app.getPath('userData'), 'knowledge-base');
const DOCS_DIR = path.join(DATA_DIR, 'documents');

// 确保数据目录存在
function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
  console.log('Data directory:', DATA_DIR);
  console.log('Documents directory:', DOCS_DIR);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    title: '知识库应用',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
  });

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}

// ——— IPC 处理程序 ———

// 获取文档列表
ipcMain.handle('docs:list', async () => {
  try {
    const files = fs.readdirSync(DOCS_DIR);
    const docs = files
      .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
      .map(f => {
        const filePath = path.join(DOCS_DIR, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          title: f.replace(/\.(md|txt)$/, ''),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      });
    return { success: true, data: docs };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 读取文档内容
ipcMain.handle('docs:read', async (event, filename) => {
  try {
    const filePath = path.join(DOCS_DIR, filename);
    if (!filePath.startsWith(DOCS_DIR)) {
      return { success: false, error: '非法路径' };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 创建文档
ipcMain.handle('docs:create', async (event, { title, content }) => {
  try {
    const filename = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')}.md`;
    const filePath = path.join(DOCS_DIR, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, data: { name: filename, title } };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 更新文档
ipcMain.handle('docs:update', async (event, { filename, content }) => {
  try {
    const filePath = path.join(DOCS_DIR, filename);
    if (!filePath.startsWith(DOCS_DIR)) {
      return { success: false, error: '非法路径' };
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 删除文档
ipcMain.handle('docs:delete', async (event, filename) => {
  try {
    const filePath = path.join(DOCS_DIR, filename);
    if (!filePath.startsWith(DOCS_DIR)) {
      return { success: false, error: '非法路径' };
    }
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 导入文档（通过文件选择对话框）
ipcMain.handle('docs:import', async () => {
  const result = await dialog.showOpenDialog({
    title: '导入文档',
    filters: [
      { name: '文本文件', extensions: ['md', 'txt'] },
      { name: '所有文件', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  });
  if (result.canceled) {
    return { success: false, canceled: true };
  }
  const imported = [];
  for (const srcPath of result.filePaths) {
    const filename = path.basename(srcPath);
    const destPath = path.join(DOCS_DIR, filename);
    fs.copyFileSync(srcPath, destPath);
    imported.push(filename);
  }
  return { success: true, data: imported };
});

// 获取数据目录路径
ipcMain.handle('app:getDataDir', async () => {
  return DATA_DIR;
});

// 问答功能（基于文档内容的简单关键词搜索）
ipcMain.handle('qa:query', async (event, { question, docName }) => {
  try {
    let context = '';
    if (docName) {
      // 仅在指定文档中搜索
      const filePath = path.join(DOCS_DIR, docName);
      context = fs.readFileSync(filePath, 'utf-8');
    } else {
      // 在所有文档中搜索
      const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
      context = files
        .map(f => {
          const content = fs.readFileSync(path.join(DOCS_DIR, f), 'utf-8');
          return `### ${f}\n${content}`;
        })
        .join('\n\n---\n\n');
    }
    // 简单关键词匹配答案
    const answer = simpleQA(question, context);
    return { success: true, data: answer };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

/**
 * 简单的本地关键词问答引擎
 * 从文档中找到与问题相关的段落作为答案
 */
function simpleQA(question, context) {
  if (!context.trim()) {
    return '知识库中暂无文档，请先添加文档。';
  }

  const keywords = question
    .replace(/[？?！!，,。.、]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const paragraphs = context
    .split(/\n{2,}/)
    .filter(p => p.trim().length > 10);

  // 为每个段落打分
  const scored = paragraphs.map(p => {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw, 'gi');
      const matches = p.match(regex);
      if (matches) score += matches.length;
    }
    return { text: p.trim(), score };
  });

  // 按分数排序，取前3段
  const top = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (top.length === 0) {
    return `在知识库中未找到与「${question}」相关的内容。\n\n请尝试更换关键词，或先导入相关文档。`;
  }

  return `根据知识库内容，以下是与您问题最相关的内容：\n\n${top.map((s, i) => `**片段 ${i + 1}**\n${s.text}`).join('\n\n---\n\n')}`;
}

app.whenReady().then(() => {
  ensureDataDirs();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
