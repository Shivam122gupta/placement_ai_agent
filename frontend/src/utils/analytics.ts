/**
 * Safe, privacy-first client-side analytics helper.
 * Strictly avoids logging or sending any sensitive PII (passwords, tokens, resume details).
 */

type EventCategory = 'navigation' | 'cta' | 'auth' | 'feature' | 'error';

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  timestamp: number;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private maxStoredEvents = 50;

  /**
   * Tracks a custom user interaction or CTA click.
   */
  public trackEvent(category: EventCategory, action: string, label?: string) {
    const event: AnalyticsEvent = {
      category,
      action,
      label,
      timestamp: Date.now(),
    };

    this.events.push(event);
    if (this.events.length > this.maxStoredEvents) {
      this.events.shift();
    }

    if (import.meta.env.DEV) {
      // Clean debug log during development
      // console.debug(`[Telemetry: ${category}] ${action}`, label ? `(${label})` : '');
    }
  }

  /**
   * Track page navigation
   */
  public trackPageView(path: string) {
    this.trackEvent('navigation', 'page_view', path);
  }
}

export const analytics = new AnalyticsTracker();
export default analytics;
