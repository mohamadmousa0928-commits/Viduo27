import { Check, Crown, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { navigate } from '../lib/router';
import { PLAN_LIST, PLAN_CONFIG, isVip, type PlanId } from '../lib/coins';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

export default function PricingPage({ preselect: _preselect }: { preselect?: string }) {
  const { user, profile } = useAuth();
  const currentPlan = profile?.plan ?? 'free';
  const vip = isVip(currentPlan);

  function handleSelect(planId: PlanId) {
    if (planId === 'free') {
      navigate(user ? 'dashboard' : 'register');
      return;
    }
    if (planId === currentPlan) {
      navigate('subscription');
      return;
    }
    navigate('checkout', planId);
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <button
          onClick={() => navigate(user ? 'dashboard' : 'home')}
          className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
            <Crown className="h-3.5 w-3.5" />
            Upgrade Your Plan
          </div>
          <h1 className="!text-3xl sm:!text-4xl">Choose your plan</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-secondary">
            Unlock faster processing, more coins, and higher resolution output.
            {vip && ` You're currently on the ${PLAN_CONFIG[currentPlan as PlanId]?.label ?? 'VIP'} plan.`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_LIST.map((planId) => {
            const plan = PLAN_CONFIG[planId];
            const isCurrent = planId === currentPlan;
            const isYearly = planId === 'yearly';
            const isFree = planId === 'free';

            return (
              <div
                key={planId}
                className={`relative flex flex-col rounded-2xl border-2 bg-bg-card p-6 ${plan.borderClass} ${plan.glowClass} transition-all duration-200 hover:-translate-y-1`}
              >
                {isYearly && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold to-gold-hover px-3 py-1 text-xs font-bold text-white shadow-lg">
                      <Crown className="h-3 w-3" /> BEST VALUE
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-ink-primary">{plan.label}</h3>
                  <p className="mt-2 text-3xl font-bold text-ink-primary">{plan.priceLabel}</p>
                  <p className="mt-1 text-sm text-gold">
                    {plan.coins === 2.5 ? `${plan.coins} coins/day` : `${plan.coins} coins`}
                  </p>
                </div>

                <div className="mb-5 space-y-1.5 border-y border-gray-800/60 py-4 text-xs text-ink-muted">
                  <div className="flex items-center justify-between">
                    <span>Queue</span>
                    <span className="text-ink-secondary">{plan.queueLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Max file size</span>
                    <span className="text-ink-secondary">
                      {plan.maxFileSizeMB >= 1024 ? `${plan.maxFileSizeMB / 1024}GB` : `${plan.maxFileSizeMB}MB`}
                    </span>
                  </div>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isYearly ? 'vip' : isFree ? 'ghost' : 'primary'}
                  fullWidth
                  disabled={isCurrent}
                  onClick={() => handleSelect(planId)}
                >
                  {isCurrent ? (
                    'Current Plan'
                  ) : isFree ? (
                    'Get Started'
                  ) : planId === 'yearly' ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Subscribe
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Subscriptions auto-renew until cancelled. Coins reset on each renewal — no carryover.
        </p>
      </div>
    </div>
  );
}
