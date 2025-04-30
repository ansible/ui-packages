# Ansible UI Plugin SDK

A UI plugin SDK for implementing AAP plugins that dynamically extend the AAP UI.

The Ansible Automation Platform can be extended with new services. This is done by registering a service with the AAP gateway. Each service can extend the AAP UI with new integrations that are dynamically loaded from the service. This SDK defines the interfaces for defining a UI plugin.

There is an example repo demonstrating how to create a plugin using Module Federation.

The bundled plugin will then need to be hosted by the service that is registered with the AAP gateway.

## Navigation Integration

New navigation items can be added to the AAP navigation by creating a navigation integration.

```typescript
[
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
]
```

Components referenced in the navigation are built as part of the plugin using Module Federation. See example repo for implementation example.