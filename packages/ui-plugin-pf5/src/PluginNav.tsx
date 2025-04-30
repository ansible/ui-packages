import { usePlugins, usePluginsNavItems } from '@ansible/ui-plugin-loader'
import { Nav, NavList } from '@patternfly/react-core'
import { PluginNavItems } from './PluginNavItems'

export function PluginNav() {
  const { plugins } = usePlugins()
  const pluginNavItems = usePluginsNavItems(plugins)
  return (
    <Nav aria-label="Default global" ouiaId="DefaultNav">
      <NavList>
        <PluginNavItems pluginNavItems={pluginNavItems} />
      </NavList>
    </Nav>
  )
}
