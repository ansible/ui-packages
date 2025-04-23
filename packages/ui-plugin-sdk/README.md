# Ansible UI Plugin SDK

The Ansible Automation Platform can be extended with new services.
This is done by registering a service with the AAP gateway.
Each service can entend the AAP UI with new integrations that are dynamically loaded from the service.
This SDK defines the interfaces for defining a UI plugin.

## Example of extending the navigation

```typescript
export default function Plugin(_options: UIPluginOptions): UIPlugin {
  return {
    id: 'example-plugin',
    version: '0.0.1',
    integrations: [
      {
        id: 'example-plugin',
        type: UIIntegrationType.Navigation,
        label: 'Example Plugin',
        path: 'example-plugin',
      },
      {
        id: 'plugin-sub-navigation',
        type: UIIntegrationType.Navigation,
        label: 'Example Sub Navigation',
        component: 'SubNavigation',
        parentId: 'example-plugin',
        path: 'navigation-1',
      },
      {
        id: 'plugin-navigation-2',
        type: UIIntegrationType.Navigation,
        label: 'Example Navigation 2',
        component: 'App',
        parentId: 'example-plugin',
        path: 'navigation-2',
      },
      {
        id: 'plugin-navigation-3',
        type: UIIntegrationType.Navigation,
        label: 'Example Navigation 3',
        component: 'App',
        parentId: 'example-plugin',
        path: 'navigation-3',
      },
    ],
  };
}
```
