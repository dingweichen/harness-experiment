const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 安全地向渲染进程暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文档相关
  docs: {
    list: () => ipcRenderer.invoke('docs:list'),
    read: (filename) => ipcRenderer.invoke('docs:read', filename),
    create: (title, content) => ipcRenderer.invoke('docs:create', { title, content }),
    update: (filename, content) => ipcRenderer.invoke('docs:update', { filename, content }),
    delete: (filename) => ipcRenderer.invoke('docs:delete', filename),
    import: () => ipcRenderer.invoke('docs:import'),
  },
  // 问答相关
  qa: {
    query: (question, docName = null) => ipcRenderer.invoke('qa:query', { question, docName }),
  },
  // 应用相关
  app: {
    getDataDir: () => ipcRenderer.invoke('app:getDataDir'),
  },
});
