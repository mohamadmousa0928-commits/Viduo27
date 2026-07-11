import { useEffect, useState } from 'react';
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  FileVideo,
  Download,
  Lock,
} from 'lucide-react';
import { supabase, type VideoJob } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { isVip, FILTER_LIST, formatFileSize } from '../../lib/coins';

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

function filterLabel(id: string) {
  return FILTER_LIST.find((f) => f.id === id)?.label ?? id;
}

export default function HistoryTab({ refreshKey }: { refreshKey: number }) {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);

  const vip = isVip(profile?.plan ?? 'free');
  const FREE_LIMIT = 5;

  useEffect(() => {
    if (!user) return;
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  async function loadJobs() {
    if (!user) return;
    const { data } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('user_id', user.id)
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

  const visibleJobs = vip ? jobs : jobs.slice(0, FREE_LIMIT);
  const hiddenCount = !vip && jobs.length > FREE_LIMIT ? jobs.length - FREE_LIMIT : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="!text-2xl">Video History</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {vip ? 'All your enhancement jobs' : `Last ${FREE_LIMIT} videos (free plan)`}
          </p>
        </div>
        {vip && jobs.length > 0 && (
          <button
            onClick={() => exportHistory(jobs)}
            className="btn-ghost !px-4 !py-2"
          >
            Export CSV
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="card-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-secondary">
            <Clock className="h-7 w-7 text-ink-muted" />
          </div>
          <p className="text-sm text-ink-secondary">No video history yet.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Your enhancement jobs will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Jobs list */}
          <div className="space-y-3">
            {visibleJobs.map((job) => (
              <div key={job.id} className="card-panel p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                      <FileVideo className="h-5 w-5 text-brand" />
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
                      {job.coins_spent.toFixed(2)} coins
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadgeClass(job.status)}`}
                    >
                      {statusIcon(job.status)}
                      {job.status}
                    </span>
                  </div>
                </div>

                {/* Filters + file size */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {(job.filters_used as string[]).map((fId) => (
                    <span
                      key={fId}
                      className="rounded-md bg-bg-secondary px-2 py-1 text-xs text-ink-secondary"
                    >
                      {filterLabel(fId)}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-ink-muted">
                    {formatFileSize(job.file_size_bytes)}
                  </span>
                </div>

                {/* Download button for completed */}
                {job.status === 'completed' && job.output_url && (
                  <a
                    href={job.output_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-link hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Re-download
                  </a>
                )}

                {/* Error message */}
                {job.status === 'failed' && job.error_message && (
                  <p className="mt-2 text-xs text-error">{job.error_message}</p>
                )}
              </div>
            ))}
          </div>

          {/* Free user locked history */}
          {hiddenCount > 0 && (
            <div className="card-panel p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15">
                <Lock className="h-6 w-6 text-gold" />
              </div>
              <p className="text-sm font-medium text-ink-primary">
                {hiddenCount} more videos hidden
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Upgrade to VIP for unlimited video history and CSV export.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function exportHistory(jobs: VideoJob[]) {
  const headers = ['Filename', 'Status', 'Filters', 'Coins Spent', 'File Size', 'Created At', 'Completed At'];
  const rows = jobs.map((j) => [
    j.filename,
    j.status,
    (j.filters_used as string[]).join('; '),
    j.coins_spent.toString(),
    j.file_size_bytes?.toString() ?? '',
    j.created_at,
    j.completed_at ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'video-history.csv';
  a.click();
  URL.revokeObjectURL(url);
}
