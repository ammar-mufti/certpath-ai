import { useParams } from 'react-router-dom'
import TopNav from '../components/Nav/TopNav'
import LearnHome from '../components/Learn/LearnHome'
import DomainPage from '../components/Learn/DomainPage'

interface Props {
  certId: string
}

export default function LearnPage({ certId }: Props) {
  const { domainSlug } = useParams<{ domainSlug?: string }>()

  return (
    <div className="h-screen flex flex-col bg-navy">
      <TopNav />
      {domainSlug
        ? <DomainPage key={`${certId}-${domainSlug}`} certId={certId} />
        : <LearnHome certId={certId} />
      }
    </div>
  )
}
