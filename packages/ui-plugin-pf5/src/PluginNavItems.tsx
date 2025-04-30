import { IPluginNavItem } from '@ansible/ui-plugin-loader'
import { PluginNavItem } from './PluginNavItem'

export function PluginNavItems({ pluginNavItems }: { pluginNavItems: IPluginNavItem[] }) {
  return (
    <>
      {pluginNavItems.map((pluginNav) => (
        <PluginNavItem key={pluginNav.id} pluginNavItem={pluginNav} />
      ))}
    </>
  )
}
