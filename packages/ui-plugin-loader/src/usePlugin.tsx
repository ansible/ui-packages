import { Plugin } from '@ansible/ui-plugin-sdk'
import { useEffect, useState } from 'react'
import { loadPlugin } from './load-plugin'

export function usePlugin(name: string, entry: string) {
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    setError(null)
    loadPlugin({ name, entry, lang: navigator.language })
      .then((plugin) => {
        setPlugin(plugin)
      })
      .catch((error) => {
        setPlugin(null)
        setError(error)
      })
  }, [name, entry])
  return { plugin, error }
}
