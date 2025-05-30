import { Plugin } from '@ansible/ui-plugin-sdk'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { PluginInfo, PluginsContext } from './PluginsContext'
import { loadPlugin } from './load-plugin'

export function PluginsProvider({
  children,
  defaultPluginInfo,
}: {
  children: ReactNode
  defaultPluginInfo?: PluginInfo
}) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [pluginInfo, setPluginInfo] = useState<PluginInfo[]>(() => (defaultPluginInfo ? [defaultPluginInfo] : []))

  const addPlugin = useCallback((pluginInfo: PluginInfo) => {
    setPluginInfo((prevState) => {
      const newPluginInfo = [...prevState, pluginInfo]
      return newPluginInfo
    })
  }, [])

  const removePlugin = useCallback((pluginName: string) => {
    setPluginInfo((prevState) => {
      const newPluginInfo = prevState.filter((plugin) => plugin.name !== pluginName)
      return newPluginInfo
    })
  }, [])

  useEffect(() => {
    setPluginInfo((prevState) => {
      let updated = false
      const newPluginInfoArray = [...prevState]
      for (const pluginInfo of newPluginInfoArray) {
        if (!pluginInfo.promise) {
          pluginInfo.promise = loadPlugin({
            name: pluginInfo.name,
            entry: pluginInfo.entry,
            lang: 'en',
          })
            .then((plugin) => {
              console.log('loaded plugin', plugin)
              setPlugins((prevState) => {
                const updatedPlugins = [...prevState]
                const index = updatedPlugins.findIndex((p) => p.id === plugin.id)
                if (index !== -1) {
                  updatedPlugins[index] = plugin
                } else {
                  updatedPlugins.push(plugin)
                }
                return updatedPlugins
              })
            })
            .catch((e) => {
              console.error('Error loading plugin:', e)
            })
          updated = true
        }
      }
      if (updated) {
        return newPluginInfoArray
      } else {
        return prevState
      }
    })
  }, [pluginInfo])

  return (
    <PluginsContext.Provider
      value={{
        plugins,
        pluginInfo,
        addPlugin,
        removePlugin,
      }}
    >
      {children}
    </PluginsContext.Provider>
  )
}
