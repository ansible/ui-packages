import { PluginRouter } from './PluginRouter'
import { PluginInfo } from './PluginsContext'
import { PluginsProvider } from './PluginsProvider'

export function PluginApp({ title, defaultPluginInfo }: { title: string; defaultPluginInfo?: PluginInfo }) {
  return (
    <PluginsProvider defaultPluginInfo={defaultPluginInfo}>
      <PluginRouter title={title} />
    </PluginsProvider>
  )
}
