import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: "https://owlks4.github.io/3d-pixel-picrew/",
  build: {
    rollupOptions: {
      input: {
        app: './index.html',
        'gif.worker': './gif.worker.js',
      },
      output: {        
        entryFileNames: assetInfo => {
          return assetInfo.name === 'gif.worker'
             ? '[name].js'               //gif worker goes in root
             : 'assets/js/[name]-[hash].js'   //everything else gets bundled
        }
      },
    },
  },
})