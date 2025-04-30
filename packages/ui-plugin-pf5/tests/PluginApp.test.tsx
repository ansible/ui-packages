import { PluginInfo } from '@ansible/ui-plugin-loader'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PluginApp } from '..'

describe('PluginApp', () => {
  it('renders the PluginRouter with the provided title', () => {
    render(<PluginApp title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('passes defaultPluginInfo to PluginsProvider', () => {
    const mockPluginInfo: PluginInfo = { name: 'Test Plugin', url: 'www.example.com' }
    render(<PluginApp title="Test Title" defaultPluginInfo={mockPluginInfo} />)
    // Assuming PluginsProvider renders something based on defaultPluginInfo
    // Add assertions here if PluginsProvider has visible output
  })
})
