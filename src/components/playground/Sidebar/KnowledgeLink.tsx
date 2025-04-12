'use client'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import Link from 'next/link'
import { useQueryState } from 'nuqs'

export const KnowledgeLink = () => {
  const [agentId] = useQueryState('agent')

  return (
    <div className="w-full">
      <Link href={`/knowledge?agent=${agentId || ''}`} passHref>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-medium text-muted hover:text-primary"
          disabled={!agentId}
        >
          <Icon type="references" size="xs" />
          Knowledge Management
        </Button>
      </Link>
    </div>
  )
}

export default KnowledgeLink
