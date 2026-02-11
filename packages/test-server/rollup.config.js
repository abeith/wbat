import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import path from 'path';

const banner = (chunk) => {
  const source = chunk.facadeModuleId
    ? path.relative(process.cwd(), chunk.facadeModuleId)
    : 'unknown';
  return (
    `// GENERATED FILE: built from ${source}\n` +
    '// Run: npm run build -w packages/test-server\n'
  );
};

export default {
  input: 'src/expt.ts',
  output: [
    {
      file: 'public/jspsych.js',
      format: 'es',
      banner,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    postcss({
      plugins: [],
    }),
    typescript(),
  ],
};
