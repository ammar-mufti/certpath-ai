import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import DomainNav from './DomainNav'
import PageNav from './PageNav'

interface Props {
  children: ReactNode
  showPageNav?: boolean
  activeDomain?: string
  sections?: { id: string; label: string }[]
}

export default function LearnLayout({ children, showPageNav = false, activeDomain, sections }: Props) {
  const { certId } = useParams<{ certId: string }>()
  const resolvedCertId = certId ?? 'ccxp'

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <aside className="hidden md:flex w-[260px] flex-shrink-0 border-r border-white/10 overflow-y-auto">
        <DomainNav activeDomain={activeDomain} certId={resolvedCertId} />
      </aside>

      <main id="main-scroll" className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>

      {showPageNav && sections && sections.length > 0 && (
        <aside className="hidden lg:flex w-[220px] flex-shrink-0 border-l border-white/10 overflow-y-auto">
          <PageNav sections={sections} activeDomain={activeDomain} />
        </aside>
      )}
    </div>
  )
}
