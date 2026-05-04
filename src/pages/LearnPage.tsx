import { useParams } from 'react-router-dom'
import LearnHome from '../components/Learn/LearnHome'
import DomainPage from '../components/Learn/DomainPage'

interface Props {
  certId: string
}

export default function LearnPage({ certId }: Props) {
  const { domainSlug } = useParams<{ domainSlug?: string }>()
  return domainSlug
    ? <DomainPage key={`${certId}-${domainSlug}`} certId={certId} />
    : <LearnHome key={certId} />
}
