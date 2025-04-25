import '@patternfly/react-core/dist/styles/base.css'
import { lazy, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const App = lazy(() => import('./App'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
