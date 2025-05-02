import { ErrorBoundaryContext } from '@ansible/ui-plugin-loader'
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Icon,
  PageSection,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { CSSProperties, useContext } from 'react'

export function PluginErrorComponent({ title, style }: { title: string; style?: CSSProperties }) {
  const errorFromContext = useContext(ErrorBoundaryContext)
  let error: Error
  if (errorFromContext && typeof errorFromContext.message === 'string') {
    error = errorFromContext
  } else {
    error = new Error('Unknown error occurred. Please check the console for more details.')
  }

  return (
    <PageSection isFilled style={style}>
      <Bullseye>
        <EmptyState>
          <EmptyStateHeader
            titleText={title}
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
  )
}
