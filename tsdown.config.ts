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
        dts = '.d.cts';
        break;
      case 'es':
        js = '.mjs';
        dts = '.d.ts';
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
