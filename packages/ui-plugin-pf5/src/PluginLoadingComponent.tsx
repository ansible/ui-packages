import { Bullseye, PageSection, Spinner } from '@patternfly/react-core'
import { CSSProperties } from 'react'

export function PluginLoadingComponent({ style }: { style?: CSSProperties }) {
  return (
    <PageSection isFilled style={style}>
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    </PageSection>
  )
}
