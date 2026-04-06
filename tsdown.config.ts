import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['index.ts'],
  dts: true,
  outExtensions: (context) => {
    let js = '.js';
    let dts = '.d.ts';
    switch (context.format) {
      case 'cjs':
        js = '.js';
        break;
      case 'es':
        js = '.mjs';
        dts = '.d.mts';
        break;
      case 'umd':
      case 'iife':
        js = '.js';
        break;
    }
    return { js, dts };
  },
  format: ['esm', 'cjs'],
});
