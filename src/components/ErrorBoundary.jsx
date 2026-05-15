import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
