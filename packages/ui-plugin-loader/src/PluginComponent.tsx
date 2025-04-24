import { loadRemote } from '@module-federation/enhanced/runtime'
import { ComponentType, lazy, Suspense, useMemo } from 'react'
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
export function PluginComponent({ pluginName, componentName }: { pluginName: string; componentName: string }) {
  const RemoteComponent = useMemo(() => {
    return lazy(
      () =>
        loadRemote(`${pluginName}/${componentName}`) as Promise<{
          default: ComponentType
        }>,
    )
  }, [componentName, pluginName])
  return (
    <Suspense
      fallback={
        <div>Loading...</div>
        // <Bullseye>
        //   <Spinner size="xl" />
        // </Bullseye>
      }
    >
      <ErrorBoundary
      // message={
      //   <EmptyState>
      //     <EmptyStateHeader
      //       titleText={t('Component Error')}
      //       headingLevel="h4"
      //       icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
      //     />
      //     <EmptyStateBody>
      //       {t('The component could not be loaded. Please check the console for more details.')}
      //     </EmptyStateBody>
      //   </EmptyState>
      // }
      >
        <RemoteComponent />
      </ErrorBoundary>
    </Suspense>
  )
}
