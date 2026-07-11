import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'info';

const toneStyles: Record<Tone, { bg: string; text: string; icon: ReactNode }> = {
  error: {
    bg: 'bg-error/10 border-error/30',
    text: 'text-error',
    icon: <AlertCircle className="h-5 w-5 shrink-0" />,
  },
  success: {
    bg: 'bg-success/10 border-success/30',
    text: 'text-success',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0" />,
  },
  info: {
    bg: 'bg-brand/10 border-brand/30',
    text: 'text-ink-link',
    icon: <Info className="h-5 w-5 shrink-0" />,
  },
};

export default function Alert({
  tone = 'info',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const s = toneStyles[tone];
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${s.bg} ${s.text}`}>
      {s.icon}
      <div className="text-sm">{children}</div>
    </div>
  );
}
