import { Component, ReactNode } from 'react'

interface Props {
  errorComponent?: ReactNode
  children?: ReactNode
}

interface State {
  errorMessage: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { errorMessage: null }

  public static getDerivedStateFromError(error: Error): State {
    return { errorMessage: error.message }
  }

  public render() {
    if (this.state.errorMessage) {
      return this.props.errorComponent ?? this.state.errorMessage
    }
    return this.props.children
  }
}
