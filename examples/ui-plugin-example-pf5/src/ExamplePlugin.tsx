import { IntegrationType, Plugin, PluginOptions } from '@ansible/ui-plugin-sdk'

export default function ExamplePlugin(options: PluginOptions): Plugin {
  console.log('Plugin options', options)
  return {
    id: 'example-plugin',
    version: '0.0.1',
    integrations: [
      {
        id: 'group-1',
        type: IntegrationType.Navigation,
        label: 'UI Example Plugin',
        path: 'group-1',
      },
      {
        id: 'page-1',
        type: IntegrationType.Navigation,
        label: 'Example Page',
        component: 'ExamplePage',
        parentId: 'group-1',
        path: 'page-1',
      },
    ],
  }
}
