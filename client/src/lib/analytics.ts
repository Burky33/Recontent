export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params)
    }
  }
  
  export const trackSignUp = () => trackEvent('sign_up')
  export const trackStartTrial = () => trackEvent('start_trial')
  export const trackUpgrade = (plan: string) => trackEvent('upgrade', { plan })