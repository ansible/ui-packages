import { Route } from 'react-router'
import { PluginComponent } from './PluginComponent'
import { IPluginNavItem } from './PluginNavItem'

export function pluginNavRoutes(pluginNavItems: IPluginNavItem[]) {
  return pluginNavItems.map((pluginNav) => (
    <Route
      key={pluginNav.id}
      path={pluginNav.path}
      element={
        pluginNav.componentName && (
          <PluginComponent key={pluginNav.id} pluginName="remote-app" componentName={pluginNav.componentName} />
        )
      }
    >
      {pluginNav.children && pluginNavRoutes(pluginNav.children)}
    </Route>
  ))
}
