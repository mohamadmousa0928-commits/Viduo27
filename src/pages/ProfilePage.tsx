import { useEffect, useState } from 'react';
import {
  Coins,
  Crown,
  Mail,
  Calendar,
  CreditCard,
  LogOut,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { supabase, type UserProfile, type VideoJob, type Payment } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { navigate } from '../lib/router';
import Card from '../components/Card';
import Button from '../components/Button';
import { LayoutDashboard } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('login');
      return;
    }
    refreshProfile();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadData() {
    if (!user) return;
    const [jobsRes, paymentsRes] = await Promise.all([
      supabase
        .from('video_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
    setJobs((jobsRes.data as VideoJob[]) ?? []);
    setPayments((paymentsRes.data as Payment[]) ?? []);
    setDataLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) return null;

  const p: Partial<UserProfile> = profile ?? {};
  const planLabel = p.plan ?? 'free';
  const isVip = planLabel !== 'free';

  return (
    <div className="min-h-screen">
      {/* Header banner */}
      <div className="relative overflow-hidden border-b border-gray-800/60 bg-bg-card">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(59,130,246,0.25), transparent 60%), radial-gradient(ellipse at top right, rgba(124,58,237,0.2), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-2xl font-bold text-brand">
                {(user.email ?? 'U')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="!text-2xl">{user.email}</h1>
                <div className="mt-1 flex items-center gap-2">
                  {isVip ? (
                    <span className="vip-gradient inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white">
                      <Crown className="h-3 w-3 text-gold-crown" />
                      {planLabel.toUpperCase()} PLAN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-bg-secondary px-3 py-1 text-xs font-semibold text-ink-secondary">
                      FREE PLAN
                    </span>
                  )}
                  <span className="text-xs text-ink-muted">
                    Member since {new Date(p.created_at ?? user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
            <Button onClick={() => navigate('dashboard')}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card hover className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15">
              <Coins className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Coin balance</p>
              <p className="text-2xl font-bold text-gradient-gold">
                {(p.coins_balance ?? 0).toFixed(2)}
              </p>
            </div>
          </Card>

          <Card hover className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15">
              <Video className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Total jobs</p>
              <p className="text-2xl font-bold text-ink-primary">{jobs.length}</p>
            </div>
          </Card>

          <Card hover className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vip-from/15">
              <CreditCard className="h-6 w-6 text-vip-from" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Payments</p>
              <p className="text-2xl font-bold text-ink-primary">{payments.length}</p>
            </div>
          </Card>
        </div>

        {/* Subscription card */}
        <Card className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="!text-lg">Subscription</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                {isVip
                  ? `Your ${planLabel} plan is active.`
                  : 'You are on the free plan with 2.50 starter coins.'}
              </p>
              {p.subscription_expires_at && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  Expires {new Date(p.subscription_expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
            <Button variant="vip" onClick={() => navigate(isVip ? 'subscription' : 'pricing')}>
              <Crown className="h-4 w-4" />
              {isVip ? 'Manage plan' : 'Upgrade to VIP'}
            </Button>
          </div>
        </Card>

        {/* Account info */}
        <Card className="mt-6">
          <h2 className="!text-lg">Account</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-ink-muted" />
              <span className="text-sm text-ink-secondary">{user.email}</span>
              {user.email_confirmed_at ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                  <Clock className="h-3 w-3" /> Unverified
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Video jobs */}
        <div className="mt-6">
          <h2 className="mb-3 !text-lg">Recent video jobs</h2>
          {dataLoading ? (
            <Card>
              <div className="flex items-center gap-2 text-ink-secondary">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-muted text-center py-4">
                No video jobs yet. Upload a video to get started.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <Card key={job.id} hover className="!p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                        <Video className="h-5 w-5 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-primary">
                          {job.filename}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gold">
                        -{job.coins_spent.toFixed(2)} coins
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Payment history */}
        <div className="mt-6">
          <h2 className="mb-3 !text-lg">Payment history</h2>
          {dataLoading ? (
            <Card>
              <div className="flex items-center gap-2 text-ink-secondary">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            </Card>
          ) : payments.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-muted text-center py-4">
                No payments yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {payments.map((pay) => (
                <Card key={pay.id} hover className="!p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-ink-muted" />
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
                        +{pay.coins_added.toFixed(2)} coins
                      </span>
                      <PaymentStatusBadge status={pay.status} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VideoJob['status'] }) {
  const map = {
    queued: { icon: <Clock className="h-3 w-3" />, text: 'text-ink-secondary', bg: 'bg-bg-secondary' },
    processing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: 'text-brand', bg: 'bg-brand/15' },
    completed: { icon: <CheckCircle2 className="h-3 w-3" />, text: 'text-success', bg: 'bg-success/15' },
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

function PaymentStatusBadge({ status }: { status: Payment['status'] }) {
  const map = {
    pending: { text: 'text-warning', bg: 'bg-warning/15' },
    success: { text: 'text-success', bg: 'bg-success/15' },
    failed: { text: 'text-error', bg: 'bg-error/15' },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}
