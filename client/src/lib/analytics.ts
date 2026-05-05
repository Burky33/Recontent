import posthog from "posthog-js";

const gtagEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

// Auth
export const trackSignUp = () => {
  gtagEvent('sign_up')
  posthog.capture('sign_up')
}

export const trackStartTrial = () => {
  gtagEvent('start_trial')
  posthog.capture('start_trial')
}

// Upgrades
export const trackUpgrade = (plan: string) => {
  gtagEvent('upgrade', { plan })
  posthog.capture('upgrade_clicked', { plan })
}

export const trackPlanViewed = (plan: string) => {
  posthog.capture('plan_viewed', { plan })
}

// Workspaces
export const trackWorkspaceCreated = (workspaceId: string) => {
  posthog.capture('workspace_created', { workspace_id: workspaceId })
}

// Generations
export const trackGenerationRun = (workspaceId: string, plan: string) => {
  posthog.capture('generation_run', { workspace_id: workspaceId, plan })
}

export const trackGenerationSuccess = (workspaceId: string, plan: string) => {
  posthog.capture('generation_success', { workspace_id: workspaceId, plan })
}

export const trackGenerationFailed = (workspaceId: string, error: string) => {
  posthog.capture('generation_failed', { workspace_id: workspaceId, error })
}

// Paywall
export const trackPaywallHit = (plan: string) => {
  posthog.capture('paywall_hit', { plan })
}