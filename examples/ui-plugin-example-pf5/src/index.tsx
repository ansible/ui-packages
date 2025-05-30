/* v8 ignore start */

import '@patternfly/react-core/dist/styles/base.css'

import { PluginApp } from '@ansible/ui-plugin-pf5'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginApp
      title="Plugin Example"
      defaultPluginInfo={{
        name: 'remote-app',
        entry: 'http://localhost:4173/ui-plugin.js',
      }}
    />
  </StrictMode>,
)

/* v8 ignore stop */
