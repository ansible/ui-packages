import { PluginInfo, PluginsProvider } from '@ansible/ui-plugin-loader'
import { PluginRouter } from './PluginRouter'

export function PluginApp({ title, defaultPluginInfo }: { title: string; defaultPluginInfo?: PluginInfo }) {
  return (
    <PluginsProvider defaultPluginInfo={defaultPluginInfo}>
      <PluginRouter title={title} />
    </PluginsProvider>
  )
}
