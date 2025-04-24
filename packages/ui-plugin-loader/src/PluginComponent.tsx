import { loadRemote } from '@module-federation/enhanced/runtime'
import { ComponentType, lazy, ReactNode, Suspense, useMemo } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Dynamically loads a React Component from a ModuleFederation host.
 *
 * This is used in places were PlatformServices have a UI plugin
 * and the UI plugin has UI integrations which load a component.
 *
 * Example:
 *   A UI plugin extends the left hand navigation and
 *   indicates what dynamic component to use for the navigation.
 */
export function PluginComponent({
  pluginName,
  componentName,
  loadingComponent,
  errorComponent,
}: {
  pluginName: string
  componentName: string
  loadingComponent?: ReactNode
  errorComponent?: ReactNode
}) {
  const RemoteComponent = useMemo(() => {
    return lazy(
      () =>
        loadRemote(`${pluginName}/${componentName}`) as Promise<{
          default: ComponentType
        }>,
    )
  }, [componentName, pluginName])
  return (
    <Suspense fallback={loadingComponent ?? <div>Loading...</div>}>
      <ErrorBoundary errorComponent={errorComponent}>
        <RemoteComponent />
      </ErrorBoundary>
    </Suspense>
  )
}
