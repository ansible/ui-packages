import { NavExpandable, NavItem } from '@patternfly/react-core'
import { useMatch, useNavigate } from 'react-router'

export interface IPluginNavItem {
  id: string
  label?: string
  path: string
  fullPath: string
  children?: IPluginNavItem[]
  componentName?: string
}

export function PluginNavItems({ pluginNavItems }: { pluginNavItems: IPluginNavItem[] }) {
  return (
    <>
      {pluginNavItems.map((pluginNav) => (
        <PluginNavItem key={pluginNav.id} pluginNavItem={pluginNav} />
      ))}
    </>
  )
}

function PluginNavItem({ pluginNavItem }: { pluginNavItem: IPluginNavItem }) {
  const isActive = useMatch('/' + pluginNavItem.fullPath + '/*')
  const navigate = useNavigate()

  if (pluginNavItem.children && pluginNavItem.children.length > 0) {
    return (
      <NavExpandable key={pluginNavItem.id} title={pluginNavItem.label} isExpanded isActive={!!isActive}>
        <PluginNavItems pluginNavItems={pluginNavItem.children} />
      </NavExpandable>
    )
  }
  return (
    <NavItem
      key={pluginNavItem.id}
      id={pluginNavItem.id}
      to={'/' + pluginNavItem.fullPath}
      isActive={!!isActive}
      onClick={(e) => {
        e.preventDefault()
        navigate('/' + pluginNavItem.fullPath)
      }}
    >
      {pluginNavItem.label}
    </NavItem>
  )
}
