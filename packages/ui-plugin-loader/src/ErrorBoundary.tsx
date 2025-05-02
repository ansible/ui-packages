import { Component, createContext, ReactNode } from 'react'

interface Props {
  errorComponent?: ReactNode
  children?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { error: null }

  public static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  public render() {
    if (this.state.error) {
      return this.props.errorComponent ? (
        <ErrorBoundaryContext.Provider value={this.state.error}>
          {this.props.errorComponent}
        </ErrorBoundaryContext.Provider>
      ) : (
        this.state.error.message
      )
    }
    return this.props.children
  }
}

export const ErrorBoundaryContext = createContext<Error | null>(null)
