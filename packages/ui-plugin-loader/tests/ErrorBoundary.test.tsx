import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorBoundary } from '../src/ErrorBoundary'

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('renders the error message when an error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test Error')
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Test Error')).toBeInTheDocument()
  })

  it('renders the custom error component when provided', () => {
    const ThrowError = () => {
      throw new Error('Test Error')
    }

    render(
      <ErrorBoundary errorComponent={<div>Custom Error Component</div>}>
        <ThrowError />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom Error Component')).toBeInTheDocument()
  })
})
