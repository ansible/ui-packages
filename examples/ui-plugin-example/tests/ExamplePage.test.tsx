import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ExamplePage from '../src/ExamplePage'

describe('ExamplePage', () => {
  it('renders the ExamplePage component', () => {
    render(<ExamplePage />)

    // Check if the CardHeader text is rendered
    expect(screen.getByText('Example Plugin.')).toBeInTheDocument()

    // Check if the CardBody text is rendered
    expect(screen.getByText('This is an example plugin. It is dynamically added to the UI.')).toBeInTheDocument()
  })
})
