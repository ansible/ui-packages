import { Plugin } from '@ansible/ui-plugin-sdk'
import { createContext, Dispatch, SetStateAction, useContext } from 'react'

export const PluginsContext = createContext<[Plugin[], Dispatch<SetStateAction<Plugin[]>>]>([
  [],
  () => {
    throw new Error('setPlugins not implemented')
  },
])

export function usePlugins(): [Plugin[], Dispatch<SetStateAction<Plugin[]>>] {
  return useContext(PluginsContext)
}
