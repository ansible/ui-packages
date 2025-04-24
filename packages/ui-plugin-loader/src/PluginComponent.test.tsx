import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PluginComponent } from './PluginComponent'

// Mock dependencies
vi.mock('@module-federation/enhanced/runtime', () => ({
  loadRemote: vi.fn(() => Promise.resolve({ default: () => <div>Mocked Component</div> })),
}))

vi.mock('./ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('PluginComponent', () => {
  it('renders the remote component successfully', async () => {
    const { getByText } = render(<PluginComponent pluginName="testPlugin" componentName="testComponent" />)

    // Verify loading state
    expect(getByText('Loading...')).toBeDefined()

    // Wait for the remote component to load
    const resolvedComponent = await screen.findByText('Mocked Component')
    expect(resolvedComponent).toBeDefined()
  })

  // it('renders the error boundary when an error occurs', async () => {
  //   // Mock loadRemote to throw an error
  //   vi.mocked(require('@module-federation/enhanced/runtime').loadRemote).mockImplementationOnce(() =>
  //     Promise.reject(new Error('Failed to load remote component')),
  //   )

  //   render(<PluginComponent pluginName="testPlugin" componentName="testComponent" />)

  //   // Verify loading state
  //   expect(screen.getByText('Loading...')).toBeInTheDocument()

  //   // Wait for the error boundary to render
  //   const errorBoundary = await screen.findByText('Mocked Component') // Adjust based on your ErrorBoundary implementation
  //   expect(errorBoundary).toBeInTheDocument()
  // })
})
