import { IntegrationType, Plugin, PluginOptions } from '@ansible/ui-plugin-sdk'

export default function ExamplePlugin(options: PluginOptions): Plugin {
  console.log('Plugin options', options)
  return {
    id: 'example-plugin',
    version: '0.0.1',
    integrations: [
      {
        // Example of a navigation integration
        id: 'example-ui-plugin-nav',
        type: IntegrationType.Navigation,
        label: 'Example UI Plugin',
        path: 'example-plugin',
      },
      {
        // Example of a navigation integration
        // this is a child of the previous one
        // and loads a React component from the plugin
        id: 'example-ui-plugin-page',
        type: IntegrationType.Navigation,
        label: 'Example Page',
        component: 'ExamplePage',
        parentId: 'example-ui-plugin-nav',
        path: 'example-ui-plugin-page',
      },
    ],
  }
}
