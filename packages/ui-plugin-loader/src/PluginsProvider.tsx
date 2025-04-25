import { Plugin } from '@ansible/ui-plugin-sdk'
import { ReactNode, useState } from 'react'
import { PluginsContext } from './PluginsContext'

export function PluginsProvider({ children }: { children: ReactNode }) {
  const value = useState<Plugin[]>([])
  return <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>
}
