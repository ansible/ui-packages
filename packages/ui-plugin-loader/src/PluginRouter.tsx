import { Page } from '@patternfly/react-core'
import { BrowserRouter, Routes } from 'react-router'
import { PluginMasthead } from './PluginMasthead'
import { pluginNavRoutes } from './PluginRoutes'
import { usePlugins } from './PluginsContext'
import { PluginSidebar } from './PluginSidebar'
import { usePluginsNavItems } from './usePluginsNavItems'

export function PluginRouter({ title }: { title: string }) {
  const { plugins } = usePlugins()
  const pluginNavItems = usePluginsNavItems(plugins)
  console.log('PluginNavItems', pluginNavItems)
  return (
    <BrowserRouter>
      <Page header={<PluginMasthead title={title} />} sidebar={<PluginSidebar />} isManagedSidebar>
        <Routes>
          {/* <Route path="/" element={<h1>Welcome to the Plugin App</h1>} /> */}
          {pluginNavRoutes(pluginNavItems)}
        </Routes>
      </Page>
    </BrowserRouter>
  )
}
