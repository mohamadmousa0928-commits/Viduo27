import { useEffect, useState } from 'react';
import {
  Crown,
  Coins,
  Calendar,
  CreditCard,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { supabase, type UserProfile, type Payment } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { navigate } from '../lib/router';
import { PLAN_CONFIG, isVip, type PlanId } from '../lib/coins';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';

export default function SubscriptionPage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('login');
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      refreshProfile();
      loadPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadPayments() {
    if (!user) return;
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPayments((data as Payment[]) ?? []);
    setDataLoading(false);
  }

  async function handleCancel() {
    if (!user) return;
    setCancelling(true);
    try {
      await supabase
        .from('users_profiles')
        .update({ plan: 'free', subscription_expires_at: null })
        .eq('id', user.id);

      // Send cancellation email
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'subscription_cancelled',
            email: user.email,
            plan: profile?.plan,
            expiry_date: profile?.subscription_expires_at
              ? new Date(profile.subscription_expires_at).toLocaleDateString()
              : 'immediately',
          }),
        });
      } catch {
        // non-blocking
      }

      await refreshProfile();
      setCancelled(true);
      setShowCancelDialog(false);
    } catch {
      // show error
    } finally {
      setCancelling(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const p: Partial<UserProfile> = profile ?? {};
  const currentPlan = (p.plan ?? 'free') as PlanId;
  const planCfg = PLAN_CONFIG[currentPlan];
  const vip = isVip(currentPlan);
  const expiryDate = p.subscription_expires_at
    ? new Date(p.subscription_expires_at)
    : null;
  const daysLeft = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <button
          onClick={() => navigate('dashboard')}
          className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink-secondary"
        >
          <LogOut className="h-4 w-4 rotate-180" />
          Back to Dashboard
        </button>

        <h1 className="!text-2xl">Subscription Management</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Manage your plan, view payment history, and cancel anytime.
        </p>

        {cancelled && (
          <div className="banner-success mt-4 flex items-start gap-3 rounded-lg px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">
              Your subscription has been cancelled. You've been moved to the Free plan.
            </p>
          </div>
        )}

        {/* Current plan card */}
        <Card className="mt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${vip ? 'bg-gold/15' : 'bg-bg-secondary'}`}>
                <Crown className={`h-7 w-7 ${vip ? 'text-gold-crown' : 'text-ink-muted'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="!text-lg">{planCfg.label}</h2>
                  {vip && (
                    <span className="vip-gradient rounded-full px-2 py-0.5 text-xs font-semibold text-white">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-ink-secondary">
                  {vip
                    ? `${planCfg.coins} coins · ${planCfg.queueLabel}`
                    : '2.50 coins per day · Basic Queue'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('pricing')}>
                <ArrowUpRight className="h-4 w-4" />
                {vip ? 'Change Plan' : 'Upgrade'}
              </Button>
              {vip && (
                <Button variant="danger" onClick={() => setShowCancelDialog(true)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-bg-secondary p-4">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Coins className="h-3.5 w-3.5" /> Remaining coins
              </div>
              <p className="mt-1 text-xl font-bold text-gradient-gold">
                {(p.coins_balance ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl bg-bg-secondary p-4">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Calendar className="h-3.5 w-3.5" /> Expiry date
              </div>
              <p className="mt-1 text-sm font-semibold text-ink-primary">
                {expiryDate ? expiryDate.toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-bg-secondary p-4">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" /> Days remaining
              </div>
              <p className="mt-1 text-sm font-semibold text-ink-primary">
                {vip ? `${daysLeft} days` : '—'}
              </p>
            </div>
          </div>
        </Card>

        {/* Plan features */}
        <Card className="mt-6">
          <h2 className="mb-3 !text-lg">Plan Features</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {planCfg.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-ink-secondary">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                {f}
              </div>
            ))}
          </div>
        </Card>

        {/* Payment history */}
        <div className="mt-6">
          <h2 className="mb-3 !text-lg">Payment History</h2>
          {dataLoading ? (
            <Card>
              <div className="flex items-center gap-2 text-ink-secondary">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            </Card>
          ) : payments.length === 0 ? (
            <Card>
              <p className="py-4 text-center text-sm text-ink-muted">
                No payments yet. Upgrade to a VIP plan to get started.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {payments.map((pay) => (
                <Card key={pay.id} hover className="!p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary">
                        <CreditCard className="h-5 w-5 text-ink-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-primary">
                          {pay.plan} — ${pay.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {pay.method} · {new Date(pay.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gold">
                        +{pay.coins_added.toFixed(0)} coins
                      </span>
                      <PaymentStatusBadge status={pay.status} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Account actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => navigate('profile')}>
            Account Profile
          </Button>
          <Button variant="ghost" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={() => setShowCancelDialog(false)} />
          <div className="card-panel relative w-full max-w-md animate-fade-in p-6">
            <button
              onClick={() => setShowCancelDialog(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-muted transition hover:bg-bg-hover hover:text-ink-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error/15">
              <AlertTriangle className="h-7 w-7 text-error" />
            </div>

            <h2 className="!text-xl">Cancel Subscription?</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              You'll lose your VIP benefits and move to the Free plan with 2.50 daily coins.
              Your remaining <strong className="text-gold">{(p.coins_balance ?? 0).toFixed(2)} coins</strong> will
              be reset. This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancel}>
                Yes, Cancel Subscription
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setShowCancelDialog(false)}>
                Keep My Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: Payment['status'] }) {
  const map = {
    pending: { icon: <Clock className="h-3 w-3" />, text: 'text-warning', bg: 'bg-warning/15' },
    success: { icon: <CheckCircle2 className="h-3 w-3" />, text: 'text-success', bg: 'bg-success/15' },
    failed: { icon: <XCircle className="h-3 w-3" />, text: 'text-error', bg: 'bg-error/15' },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon}
      {status}
    </span>
  );
}
