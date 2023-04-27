import esbuild from 'esbuild';
import { promises as fs } from 'fs';
import chokidar from 'chokidar';
import debounce from 'debounce';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

async function build() {
  esbuild.buildSync({
    bundle: true,
    entryPoints: ['./src/index.tsx'],
    outdir: 'dist',
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
    },
    define: {
      'process.env.NODE_ENV': '"' + process.env.NODE_ENV + '"',
      'process.env.DERIV_WS_URL': '"' + process.env.DERIV_WS_URL + '"'
    },
    sourcemap: true
  });

  await Promise.all([
    fs.cp('src/index.html', 'dist/index.html'),
    fs.cp(require.resolve('@deriv-experiments/react/dist/worker.js'), 'dist/worker.js')
  ]);
}

if (process.argv[2] === '--watch' || process.argv[2] === '-w') {
  chokidar.watch('src/**/*', { ignoreInitial: false }).on('all', debounce(build, 100));
  console.log('watching for changes');
} else {
  build();
}
