import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-[var(--text-muted)] mb-4">
      <Link href="/" className="hover:text-[var(--text)] transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--text)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text)] font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
