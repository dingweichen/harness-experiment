const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure output directory exists
fs.mkdirSync('dist/renderer', { recursive: true });

// Copy HTML file
fs.copyFileSync('src/renderer/index.html', 'dist/renderer/index.html');

esbuild.build({
  entryPoints: ['src/renderer/index.tsx'],
  bundle: true,
  outfile: 'dist/renderer/bundle.js',
  platform: 'browser',
  target: 'es2020',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: [],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).catch(() => process.exit(1));
