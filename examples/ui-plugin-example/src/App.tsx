import { PluginComponent, usePlugin } from '@ansible/ui-plugin-loader'
import { IntegrationType, Plugin } from '@ansible/ui-plugin-sdk'
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Icon,
  Masthead,
  MastheadBrand,
  MastheadMain,
  MastheadToggle,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  Spinner,
} from '@patternfly/react-core'
import { BarsIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useMatch, useNavigate } from 'react-router'

export default function ExampleLoader() {
  const { plugin, error } = usePlugin('remote-app', 'http://localhost:4173/')

  const pluginNavItems = usePluginNavItems(plugin)

  if (error) {
    return (
      <Page>
        <PageSection>
          <Bullseye>
            <EmptyState>
              <EmptyStateHeader
                titleText="Error Loading Plugin"
                headingLevel="h4"
                icon={
                  <EmptyStateIcon
                    icon={() => (
                      <Icon status="danger">
                        <ExclamationCircleIcon />
                      </Icon>
                    )}
                  />
                }
              />
              <EmptyStateBody>{error.message}</EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </PageSection>
      </Page>
    )
  }

  if (!plugin) {
    return (
      <Page>
        <PageSection>
          <Bullseye>
            <EmptyState>
              <EmptyStateHeader titleText="Loading" headingLevel="h4" icon={<EmptyStateIcon icon={Spinner} />} />
            </EmptyState>
          </Bullseye>
        </PageSection>
      </Page>
    )
  }

  return (
    <BrowserRouter>
      <Page
        header={
          <Masthead>
            <MastheadToggle>
              <PageToggleButton variant="plain">
                <BarsIcon />
              </PageToggleButton>
            </MastheadToggle>
            <MastheadMain>
              <MastheadBrand>Plugin Example</MastheadBrand>
            </MastheadMain>
          </Masthead>
        }
        sidebar={
          <PageSidebar>
            <PageSidebarBody>
              <Nav aria-label="Default global" ouiaId="DefaultNav">
                <NavList>
                  <PluginNavItems pluginNavItems={pluginNavItems} />
                </NavList>
              </Nav>
            </PageSidebarBody>
          </PageSidebar>
        }
        isManagedSidebar
      >
        <Routes>{pluginNavRoutes(pluginNavItems)}</Routes>
      </Page>
    </BrowserRouter>
  )
}

function pluginNavRoutes(pluginNavItems: IPluginNavItem[]) {
  return pluginNavItems.map((pluginNav) => (
    <Route
      key={pluginNav.id}
      path={pluginNav.path}
      element={
        pluginNav.componentName && (
          <PluginComponent key={pluginNav.id} pluginName="remote-app" componentName={pluginNav.componentName} />
        )
      }
    >
      {pluginNav.children && pluginNavRoutes(pluginNav.children)}
    </Route>
  ))
}

function usePluginNavItems(plugin?: Plugin | null | undefined): IPluginNavItem[] {
  const [pluginNavItems, setPluginNavItems] = useState<IPluginNavItem[]>([])

  useEffect(() => {
    if (!plugin) {
      setPluginNavItems([])
      return
    }
    const navIntegrations = plugin.integrations.filter((integration) => integration.type === IntegrationType.Navigation)
    const navMap = new Map<string, IPluginNavItem>()
    const navItems: IPluginNavItem[] = []
    for (const navIntegration of navIntegrations) {
      const navItem: IPluginNavItem = {
        id: navIntegration.id,
        path: navIntegration.path,
        label: navIntegration.label,
        fullPath: navIntegration.path,
      }
      if (navIntegration.component) {
        navItem.componentName = navIntegration.component
      }
      if (navIntegration.parentId) {
        const parent = navMap.get(navIntegration.parentId)
        if (parent) {
          navItem.fullPath = `${parent.fullPath}/${navIntegration.path}`
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(navItem)
          navMap.set(navIntegration.id, navItem)
        }
      } else {
        navItems.push(navItem)
        navMap.set(navIntegration.id, navItem)
      }
    }

    setPluginNavItems(navItems)
  }, [plugin])
  return pluginNavItems
}

function PluginNavItems({ pluginNavItems }: { pluginNavItems: IPluginNavItem[] }) {
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

interface IPluginNavItem {
  id: string
  label?: string
  path: string
  fullPath: string
  children?: IPluginNavItem[]
  componentName?: string
}
