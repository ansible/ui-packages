import { Plugin } from '@ansible/ui-plugin-sdk'
import { createContext, useContext } from 'react'

export interface PluginInfo {
  name: string
  url: string
  promise?: Promise<Plugin | void>
}

export interface PluginsState {
  plugins: Plugin[]
  pluginInfo: PluginInfo[]
  addPlugin: (pluginInfo: PluginInfo) => void
  removePlugin: (pluginName: string) => void
}

/* v8 ignore start */
export const PluginsContext = createContext<PluginsState>({
  plugins: [],
  pluginInfo: [],
  addPlugin: (_pluginInfo: PluginInfo) => {
    console.warn('addPlugin not implemented')
  },
  removePlugin: (_pluginName: string) => {
    console.warn('removePlugin not implemented')
  },
})
/* v8 ignore end */

export function usePlugins() {
  return useContext(PluginsContext)
}
