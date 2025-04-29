import { Card, CardBody, CardHeader, Page, PageSection } from '@patternfly/react-core'

export default function ExamplePage() {
  return (
    <Page>
      <PageSection>
        <Card isRounded>
          <CardHeader>Example Plugin.</CardHeader>
          <CardBody>This is an example plugin. It is dynamically added to the UI.</CardBody>
        </Card>
      </PageSection>
    </Page>
  )
}
