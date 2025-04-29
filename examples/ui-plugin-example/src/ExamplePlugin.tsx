import { IntegrationType, Plugin, PluginOptions } from '@ansible/ui-plugin-sdk'

export default function ExamplePlugin(options: PluginOptions): Plugin {
  console.log('Plugin options', options)
  return {
    id: 'example-plugin',
    version: '0.0.1',
    integrations: [
      {
        id: 'section-1',
        type: IntegrationType.Navigation,
        label: 'Section 1',
        path: 'section-1',
      },
      {
        id: 'page-1',
        type: IntegrationType.Navigation,
        label: 'Page 1',
        component: 'ExamplePage',
        parentId: 'section-1',
        path: 'page-1',
      },
      {
        id: 'page-2',
        type: IntegrationType.Navigation,
        label: 'Page 2',
        component: 'ExamplePage',
        parentId: 'section-1',
        path: 'page-2',
      },
      {
        id: 'section-2',
        type: IntegrationType.Navigation,
        label: 'Section 2',
        path: 'section-2',
      },
      {
        id: 'page-3',
        type: IntegrationType.Navigation,
        label: 'Page 3',
        component: 'ExamplePage',
        parentId: 'section-2',
        path: 'page-3',
      },
      {
        id: 'page-4',
        type: IntegrationType.Navigation,
        label: 'Page 4',
        component: 'ExamplePage',
        parentId: 'section-2',
        path: 'page-4',
      },
    ],
  }
}
