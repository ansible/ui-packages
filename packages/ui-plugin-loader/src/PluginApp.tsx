import { PluginRouter } from './PluginRouter'
import { PluginsProvider } from './PluginsProvider'

export function PluginApp({ title }: { title: string }) {
  return (
    <PluginsProvider>
      <PluginRouter title={title} />
    </PluginsProvider>
  )
}
