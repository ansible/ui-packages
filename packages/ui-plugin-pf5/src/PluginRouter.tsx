import { pluginNavRoutes, usePlugins, usePluginsNavItems } from '@ansible/ui-plugin-loader'
import { Page } from '@patternfly/react-core'
import { BrowserRouter, Routes } from 'react-router'
import { PluginErrorComponent } from './PluginErrorComponent'
import { PluginLoadingComponent } from './PluginLoadingComponent'
import { PluginMasthead } from './PluginMasthead'
import { PluginSidebar } from './PluginSidebar'

export function PluginRouter({ title }: { title: string }) {
  const { plugins } = usePlugins()
  const pluginNavItems = usePluginsNavItems(plugins)
  return (
    <BrowserRouter>
      <Page header={<PluginMasthead title={title} />} sidebar={<PluginSidebar />} isManagedSidebar>
        <Routes>
          {pluginNavRoutes(pluginNavItems, <PluginLoadingComponent />, <PluginErrorComponent title="Plugin Error" />)}
        </Routes>
      </Page>
    </BrowserRouter>
  )
}
