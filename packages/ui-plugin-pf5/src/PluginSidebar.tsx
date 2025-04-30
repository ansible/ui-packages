import { PageSidebar, PageSidebarBody } from '@patternfly/react-core'
import { PluginNav } from './PluginNav'

export function PluginSidebar() {
  return (
    <PageSidebar>
      <PageSidebarBody>
        <PluginNav />
      </PageSidebarBody>
    </PageSidebar>
  )
}
