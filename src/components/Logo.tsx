import { Sparkles } from 'lucide-react';

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="flex items-center justify-center rounded-xl bg-brand text-white shadow-lg"
        style={{ width: size, height: size }}
      >
        <Sparkles className="h-1/2 w-1/2" />
      </div>
      <span className="text-lg font-bold tracking-tight text-ink-primary">
        VidEnhance<span className="text-brand"> AI</span>
      </span>
    </div>
  );
}
