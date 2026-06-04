import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Correctif preamble React Fast Refresh.
//
// Avec rolldown-vite 8 + @vitejs/plugin-react 6, le transform JSX (oxc) injecte
// bien les appels `$RefreshSig$` dans chaque module, mais le <script> preamble
// qui DÉFINIT `window.$RefreshSig$` / `window.$RefreshReg$` n'est pas ajouté au
// HTML servi en dev → toute l'app plante au chargement (« $RefreshSig$ is not
// defined ») et affiche une page blanche.
//
// On réinjecte donc le preamble standard nous-mêmes, uniquement en mode `serve`
// (jamais dans le build de prod, où `/@react-refresh` n'existe pas).
function reactRefreshPreamble() {
  return {
    name: 'react-refresh-preamble-fix',
    apply: 'serve',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: [
            'import RefreshRuntime from "/@react-refresh"',
            'RefreshRuntime.injectIntoGlobalHook(window)',
            'window.$RefreshReg$ = () => {}',
            'window.$RefreshSig$ = () => (type) => type',
            'window.__vite_plugin_react_preamble_installed__ = true',
          ].join('\n'),
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), reactRefreshPreamble()],
})
