import { useAuthStore } from '../store/authStore'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string

async function track(event: string, data?: { certId?: string; score?: number; domain?: string }) {
  const token = useAuthStore.getState().token
  if (!token) return
  try {
    await fetch(`${WORKER_URL}/api/admin/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ event, ...data }),
    })
  } catch { /* silent fail */ }
}

export const tracker = {
  examCompleted: (certId: string, score: number) => track('exam_completed', { certId, score }),
  domainStudied: (certId: string, domain: string) => track('domain_studied', { certId, domain }),
  login: () => track('login'),
}
