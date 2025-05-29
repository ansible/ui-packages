import { Card, CardBody, CardTitle, Gallery, Page, PageSection, TextContent } from '@patternfly/react-core'
import { useEffect, useState } from 'react'

export default function ExamplePage() {
  const [characters, setCharacters] = useState<
    {
      id: number
      name: string
      fullName: string
      title: string
      imageUrl: string
    }[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/v2/characters')
      const data = await response.json()
      setCharacters(data)
    }
    fetchData()
  }, [])

  return (
    <Page>
      <PageSection variant="light" hasShadowBottom isWidthLimited>
        <TextContent>
          <h1>Example Page</h1>
          <p>This is an example page. It is dynamically added to the UI.</p>
          <p>
            The information on this page is loaded from an API call to <b>/api/v2/characters </b>
            which is proxied to <a href="https://thronesapi.com/">https://thronesapi.com/</a>.
          </p>
          <p>
            The <b>vite.config.ts</b> file is configured to proxy the API requests. This gives an example of how to
            proxy requests to a service while developing the plugin.
          </p>
        </TextContent>
      </PageSection>
      <PageSection isFilled hasOverflowScroll isWidthLimited>
        <Gallery hasGutter>
          {characters.map((character) => (
            <Card key={character.id} isRounded>
              <CardTitle>
                <TextContent>
                  {character.fullName}
                  <small>{character.title}</small>
                </TextContent>
              </CardTitle>
              <CardBody>
                <img src={character.imageUrl} alt={character.name} style={{ borderRadius: 16, width: '100%' }} />
              </CardBody>
            </Card>
          ))}
        </Gallery>
      </PageSection>
    </Page>
  )
}
