import { Masthead, MastheadBrand, MastheadMain, MastheadToggle, PageToggleButton } from '@patternfly/react-core'
import { BarsIcon } from '@patternfly/react-icons'

export function PluginMasthead({ title }: { title: string }) {
  return (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton variant="plain">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>{title}</MastheadBrand>
      </MastheadMain>
    </Masthead>
  )
}
