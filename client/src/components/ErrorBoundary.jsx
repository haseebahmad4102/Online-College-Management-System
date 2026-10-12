import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-2xl rounded-xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Something went wrong.</h1>
            <p className="mb-4 text-slate-600">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mb-6 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reload Page
            </button>
            
            {this.state.error && (
              <div className="mt-4 overflow-auto rounded bg-slate-100 p-4 text-xs text-slate-800">
                <p className="font-bold">{this.state.error.toString()}</p>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
