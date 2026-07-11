import type { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`card p-6 ${hover ? 'card-hover' : ''} ${className}`}>{children}</div>
  );
}
