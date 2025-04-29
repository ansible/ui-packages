/* v8 ignore start */

import '@patternfly/react-core/dist/styles/base.css'

import { PluginApp } from '@ansible/ui-plugin-loader'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginApp title="Plugin Example" defaultPluginInfo={{ name: 'remote-app', url: 'http://localhost:4173/' }} />
  </StrictMode>,
)

/* v8 ignore stop */
