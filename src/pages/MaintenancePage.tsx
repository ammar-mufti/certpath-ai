export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="font-serif text-3xl text-cream mb-3">Under Maintenance</h1>
        <p className="text-mist mb-2">CertPath AI is temporarily unavailable.</p>
        <p className="text-mist text-sm mb-8">We'll be back shortly. Check back in a few minutes.</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-mist text-sm">
          <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
          Scheduled maintenance in progress
        </div>
      </div>
    </div>
  )
}
