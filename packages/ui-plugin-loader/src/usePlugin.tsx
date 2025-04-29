import { isValidPlugin, Plugin } from '@ansible/ui-plugin-sdk'
import { useEffect, useState } from 'react'
import { loadPlugin } from './load-plugin'

export function usePlugin(pluginName: string, pluginUrl: string) {
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    setError(null)
    loadPlugin({
      pluginName,
      pluginUrl,
      lang: navigator.language,
      locale: navigator.language,
    })
      .then((plugin) => {
        if (isValidPlugin(plugin)) {
          setPlugin(plugin)
        } else {
          setError(new Error(`UI Plugin is of type ${JSON.stringify(plugin)}, ${plugin === null} expected 'ui-plugin'`))
        }
      })
      .catch((error) => {
        setError(error)
      })
  }, [pluginName, pluginUrl])
  return { plugin, error }
}
