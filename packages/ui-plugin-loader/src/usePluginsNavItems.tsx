import { IntegrationType, Plugin } from '@ansible/ui-plugin-sdk'
import { useEffect, useState } from 'react'
import { IPluginNavItem } from './PluginNavItem'

export function usePluginsNavItems(plugins: Plugin[]): IPluginNavItem[] {
  const [pluginNavItems, setPluginNavItems] = useState<IPluginNavItem[]>([])

  useEffect(() => {
    const navMap = new Map<string, IPluginNavItem>()
    const navItems: IPluginNavItem[] = []

    for (const plugin of plugins) {
      const navIntegrations = plugin.integrations.filter(
        (integration) => integration.type === IntegrationType.Navigation,
      )
      for (const navIntegration of navIntegrations) {
        const navItem: IPluginNavItem = {
          id: navIntegration.id,
          path: navIntegration.path,
          label: navIntegration.label,
          fullPath: navIntegration.path,
          pluginName: plugin.id,
        }
        if (navIntegration.component) {
          navItem.componentName = navIntegration.component
        }
        if (navIntegration.parentId) {
          const parent = navMap.get(navIntegration.parentId)
          if (parent) {
            navItem.fullPath = `${parent.fullPath}/${navIntegration.path}`
            if (!parent.children) {
              parent.children = []
            }
            parent.children.push(navItem)
            navMap.set(navIntegration.id, navItem)
          }
        } else {
          navItems.push(navItem)
          navMap.set(navIntegration.id, navItem)
        }
      }
    }

    setPluginNavItems(navItems)
  }, [plugins])
  return pluginNavItems
}
