// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import child_process from 'child_process';
import url from '@rollup/plugin-url';

function getCommitHash() {
  return child_process
    .execSync('git rev-parse HEAD')
    .toString()
    .trim()
    .substring(0, 7);
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    copy({
      targets: [
        { src: 'src/worklets/recorder-worklet.js', dest: 'dist/worklets' },
      ],
    }),
    replace({
      preventAssignment: true,
      'process.env.COMMIT_HASH': JSON.stringify(
        process.env.COMMIT_HASH || getCommitHash(),
      ),
      'process.env.BUILD_TIME': JSON.stringify(
        process.env.BUILD_TIME || getCurrentTimestamp(),
      ),
    }),
    url(),
    commonjs(),
    typescript(),
  ],
};
