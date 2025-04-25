import { IntegrationType } from '@ansible/ui-plugin-sdk'
import { describe, expect, it, vi } from 'vitest'
import ExamplePlugin from '../src/ExamplePlugin'

describe('ExamplePlugin', () => {
  it('should return the correct plugin configuration', () => {
    const lang = 'en'
    const plugin = ExamplePlugin({ lang })

    expect(plugin).toEqual({
      id: 'example-plugin',
      version: '0.0.1',
      integrations: [
        {
          id: 'example-plugin',
          type: IntegrationType.Navigation,
          label: 'Example Plugin',
          path: 'example-plugin',
        },
        {
          id: 'plugin-navigation',
          type: IntegrationType.Navigation,
          label: 'Example Navigation',
          component: 'App',
          parentId: 'example-plugin',
          path: 'navigation-1',
        },
      ],
    })
  })

  it('should log the requested language', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const lang = 'fr'
    ExamplePlugin({ lang })

    expect(consoleSpy).toHaveBeenCalledWith('Requested language', lang)
    consoleSpy.mockRestore()
  })
})
