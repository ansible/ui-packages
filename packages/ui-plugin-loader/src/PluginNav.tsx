import { Nav, NavList } from '@patternfly/react-core'
import { PluginNavItems } from './PluginNavItem'
import { usePlugins } from './PluginsContext'
import { usePluginsNavItems } from './usePluginsNavItems'

export function PluginNav() {
  const [plugins] = usePlugins()
  const pluginNavItems = usePluginsNavItems(plugins)
  return (
    <Nav aria-label="Default global" ouiaId="DefaultNav">
      <NavList>
        <PluginNavItems pluginNavItems={pluginNavItems} />
      </NavList>
    </Nav>
  )
}
