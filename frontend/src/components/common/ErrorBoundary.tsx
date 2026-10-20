import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { analytics } from '../../utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);

    // Track error in client-side telemetry
    try {
      analytics.trackEvent('error', 'react_crash', `${error.name}: ${error.message}`);
    } catch {
      // Ignore telemetry failure
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
  };

  private handleCopy = () => {
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#080607] flex items-center justify-center p-4 text-[#FAF8F5]">
          <div className="w-full max-w-lg rounded-3xl border border-rose-500/25 bg-[#121214] p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-rose-400">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
                  Application Runtime Notice
                </span>
                <h2 className="text-xl sm:text-2xl font-serif text-white">Something went wrong</h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
              An unexpected error occurred while rendering this interface. Your data remains safe. You can reload the view or return to the dashboard.
            </p>

            {this.state.error && (
              <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 text-xs font-mono text-neutral-300 space-y-2 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Diagnostics</span>
                  <button
                    onClick={this.handleCopy}
                    className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    {this.state.copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{this.state.copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="max-h-28 overflow-y-auto text-rose-300 break-words">
                  {this.state.error.message}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#FF6B6B]/25 transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
