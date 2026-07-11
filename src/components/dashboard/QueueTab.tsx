import { useEffect, useState } from 'react';
import { Clock, Loader2, CheckCircle2, XCircle, Mail, Info } from 'lucide-react';
import { supabase, type VideoJob } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { isVip, getPlanConfig, FILTER_LIST } from '../../lib/coins';

function statusBadgeClass(status: VideoJob['status']) {
  return {
    queued: 'badge-queued',
    processing: 'badge-processing',
    completed: 'badge-completed',
    failed: 'badge-failed',
  }[status];
}

function statusIcon(status: VideoJob['status']) {
  switch (status) {
    case 'queued':
      return <Clock className="h-3.5 w-3.5" />;
    case 'processing':
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'failed':
      return <XCircle className="h-3.5 w-3.5" />;
  }
}

function progressForStatus(status: VideoJob['status'], elapsed: number, estimated: number) {
  if (status === 'completed') return 100;
  if (status === 'failed') return 100;
  if (status === 'processing') {
    if (estimated <= 0) return 50;
    return Math.min(95, Math.round((elapsed / estimated) * 100));
  }
  // queued
  if (estimated <= 0) return 5;
  return Math.min(10, Math.round((elapsed / estimated) * 100));
}

function filterLabel(id: string) {
  return FILTER_LIST.find((f) => f.id === id)?.label ?? id;
}

export default function QueueTab({ refreshKey }: { refreshKey: number }) {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const vip = isVip(profile?.plan ?? 'free');
  const planCfg = getPlanConfig(profile?.plan ?? 'free');

  useEffect(() => {
    if (!user) return;
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      loadJobs();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadJobs() {
    if (!user) return;
    const { data } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false });
    setJobs((data as VideoJob[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="!text-2xl">Processing Queue</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Track your video enhancement jobs in real time.
        </p>
      </div>

      {/* Queue info banner */}
      {!vip && (
        <div className="banner-info flex items-start gap-3 rounded-lg px-4 py-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">
            You're in the <strong>Basic Queue</strong>. Wait time may vary from a few
            minutes up to an hour. Subscribe to skip the line in the Fast Queue.
          </p>
        </div>
      )}
      {vip && (
        <div className="banner-success flex items-start gap-3 rounded-lg px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">
            You're in the <strong>{planCfg.queueLabel}</strong>. Estimated wait: under{' '}
            {planCfg.queueWaitSeconds <= 120 ? '2 minutes' : '5 minutes'}.
          </p>
        </div>
      )}

      {/* Email notification banner */}
      {jobs.length > 0 && (
        <div className="banner-info flex items-start gap-3 rounded-lg px-4 py-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">
            You can close this window while you wait. We'll send you an email when your
            video is ready for download.
          </p>
        </div>
      )}

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="card-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-secondary">
            <Clock className="h-7 w-7 text-ink-muted" />
          </div>
          <p className="text-sm text-ink-secondary">No jobs in the queue.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Upload a video from the Enhance tab to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const now = Date.now();
            const startTime = job.started_at ? new Date(job.started_at).getTime() : new Date(job.created_at).getTime();
            const elapsed = (now - startTime) / 1000;
            const estimated = job.estimated_wait_seconds ?? planCfg.queueWaitSeconds;
            const progress = progressForStatus(job.status, elapsed, estimated);

            return (
              <div key={job.id} className="card-panel p-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                      <Loader2 className="h-5 w-5 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-primary">
                        {job.filename}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Started: {new Date(job.started_at ?? job.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusBadgeClass(job.status)}`}
                  >
                    {statusIcon(job.status)}
                    {job.status}
                  </span>
                </div>

                {/* Filters used */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(job.filters_used as string[]).map((fId) => (
                    <span
                      key={fId}
                      className="rounded-md bg-bg-secondary px-2 py-1 text-xs text-ink-secondary"
                    >
                      {filterLabel(fId)}
                    </span>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="progress-track h-2.5 w-full">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                  <span>{progress}%</span>
                  <span>{job.coins_spent.toFixed(2)} coins</span>
                </div>

                {job.status === 'failed' && job.error_message && (
                  <p className="mt-2 text-xs text-error">{job.error_message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
