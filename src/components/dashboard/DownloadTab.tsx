import { useEffect, useState } from 'react';
import { Download, FileVideo, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase, type VideoJob } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { FILTER_LIST, formatFileSize } from '../../lib/coins';

function filterLabel(id: string) {
  return FILTER_LIST.find((f) => f.id === id)?.label ?? id;
}

export default function DownloadTab({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);

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
      .eq('status', 'completed')
      .not('output_url', 'is', null)
      .order('completed_at', { ascending: false });
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
        <h1 className="!text-2xl">Downloads</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Your enhanced videos are ready to download.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="card-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-secondary">
            <Download className="h-7 w-7 text-ink-muted" />
          </div>
          <p className="text-sm text-ink-secondary">No completed videos yet.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Your enhanced videos will appear here when they're ready.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <div key={job.id} className="card-panel p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/15">
                  <FileVideo className="h-6 w-6 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-primary">
                    {job.filename}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    Completed {job.completed_at ? new Date(job.completed_at).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>

              {/* Filters */}
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

              <div className="mb-4 flex items-center justify-between text-xs text-ink-muted">
                <span>{formatFileSize(job.file_size_bytes)}</span>
                <span className="text-gold">{job.coins_spent.toFixed(2)} coins</span>
              </div>

              {job.output_url && (
                <a href={job.output_url} download target="_blank" rel="noopener noreferrer">
                  <button className="btn-primary w-full">
                    <Download className="h-4 w-4" />
                    Download Video
                  </button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
