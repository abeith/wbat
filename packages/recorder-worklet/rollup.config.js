// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import child_process from 'child_process';

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
  input: 'src/recorder-worklet.js',
  output: [
    {
      file: 'dist/recorder-worklet.js',
      format: 'es',
    },
    {
      file: '../wbat/src/worklets/recorder-worklet.js',
      format: 'es',
    },
  ],
  plugins: [
    resolve(),
    replace({
      preventAssignment: true,
      'process.env.COMMIT_HASH': JSON.stringify(
        process.env.COMMIT_HASH || getCommitHash(),
      ),
      'process.env.BUILD_TIME': JSON.stringify(
        process.env.BUILD_TIME || getCurrentTimestamp(),
      ),
    }),
    commonjs(),
  ],
};
