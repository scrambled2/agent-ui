'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { cn } from '@/lib/utils'
import Icon from '@/components/ui/icon'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentProps<typeof Icon>['type']
}

export default function SidebarNav() {
  const pathname = usePathname()
  const [agentId] = useQueryState('agent')

  const navItems: NavItem[] = [
    {
      name: 'Chat',
      href: '/',
      icon: 'agent'
    },
    {
      name: 'Knowledge',
      href: '/knowledge',
      icon: 'references'
    },
    {
      name: 'Documents',
      href: '/editor/list',
      icon: 'references'
    },
    {
      name: 'Editor',
      href: '/editor',
      icon: 'edit'
    }
  ]

  return (
    <div className="mb-4 flex w-full flex-col space-y-1">
      <div className="mb-2 text-xs font-medium uppercase text-primary">Navigation</div>
      <nav className="flex gap-1">
        {navItems.map((item) => {
          // Construct the full href with agent ID if available
          const href = agentId ? `${item.href}?agent=${agentId}` : item.href

          // Check if this is the active route
          const isActive =
            (item.href === '/' && pathname === '/') ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex h-8 flex-1 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-primaryAccent text-muted hover:bg-primary/20 hover:text-primary"
              )}
            >
              <Icon type={item.icon} size="xs" className="mr-1" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
