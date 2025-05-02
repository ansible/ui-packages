import { ReactNode } from 'react'
import { Route } from 'react-router'
import { PluginComponent } from './PluginComponent'
import { IPluginNavItem } from './PluginNavItem'

export function pluginNavRoutes(
  pluginNavItems: IPluginNavItem[],
  loadingComponent?: ReactNode,
  errorComponent?: ReactNode,
) {
  return pluginNavItems.map((pluginNav) => (
    <Route
      key={pluginNav.id}
      path={pluginNav.path}
      element={
        pluginNav.componentName && (
          <PluginComponent
            key={pluginNav.id}
            pluginName="remote-app"
            componentName={pluginNav.componentName}
            loadingComponent={loadingComponent}
            errorComponent={errorComponent}
          />
        )
      }
    >
      {pluginNav.children && pluginNavRoutes(pluginNav.children, loadingComponent, errorComponent)}
    </Route>
  ))
}
