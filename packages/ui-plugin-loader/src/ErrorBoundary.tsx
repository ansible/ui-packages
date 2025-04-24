import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  message?: ReactNode
  children?: ReactNode
}

interface State {
  message: ReactNode
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    message: this.props.message,
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return {
      message: error.message,
      hasError: true,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return <h1>{this.state.message}</h1>
    }

    return this.props.children
  }
}
