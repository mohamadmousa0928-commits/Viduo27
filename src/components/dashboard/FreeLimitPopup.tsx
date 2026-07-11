import { Crown, X, Check } from 'lucide-react';
import Button from '../Button';

export default function FreeLimitPopup({
  open,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  if (!open) return null;

  const perks = [
    'Fast Queue — results in under 2 minutes',
    'More coins per plan (up to 999 coins/year)',
    '8K output resolution priority',
    'No ads, no waiting',
    'Full video history',
    'Larger file uploads (up to 2GB)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={onClose} />
      <div className="card-panel relative w-full max-w-md animate-fade-in p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-muted transition hover:bg-bg-hover hover:text-ink-primary"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15">
          <span className="text-2xl">⚠️</span>
        </div>

        <h2 className="!text-xl">Free Plan Limitation</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Your video has been added to the Basic Queue. Processing may take between
          5 and 60 minutes. You only have 2.50 free coins per day.
        </p>

        <div className="my-5 rounded-xl border border-gold/20 bg-gold/5 p-4">
          <p className="mb-3 text-sm font-semibold text-gold">To unlock:</p>
          <ul className="space-y-2">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-ink-secondary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-vip-gradient/10 border border-vip-from/20 px-4 py-3 mb-5">
          <Crown className="h-5 w-5 text-gold-crown" />
          <p className="text-sm font-semibold text-ink-primary">
            Upgrade to VIP to process videos instantly!
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="vip" fullWidth onClick={onUpgrade}>
            <Crown className="h-4 w-4" />
            Upgrade Now
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Continue with Free Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
