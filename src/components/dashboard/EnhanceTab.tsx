import { useState, useRef, useCallback, type DragEvent } from 'react';
import { UploadCloud, FileVideo, Sparkles, Coins, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import {
  FILTER_LIST,
  totalCost,
  canAfford,
  getPlanConfig,
  isVip,
  ACCEPTED_MIME,
  ACCEPTED_FORMATS,
  formatFileSize,
  type FilterId,
} from '../../lib/coins';
import Button from '../Button';
import type { TabId } from './DashboardLayout';

export default function EnhanceTab({
  onJobCreated,
  onSwitchTab,
  onShowFreePopup,
}: {
  onJobCreated: () => void;
  onSwitchTab: (tab: TabId) => void;
  onShowFreePopup: () => void;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Set<FilterId>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const planCfg = getPlanConfig(profile?.plan ?? 'free');
  const vip = isVip(profile?.plan ?? 'free');
  const cost = totalCost([...selectedFilters]);
  const affordable = canAfford(profile, cost);

  const toggleFilter = useCallback((id: FilterId) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileSelect(f: File) {
    setError(null);
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      setError(`Unsupported format. Accepted: ${ACCEPTED_FORMATS.join(', ')}`);
      return;
    }
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB > planCfg.maxFileSizeMB) {
      setError(`File too large. Max ${planCfg.maxFileSizeMB}MB on ${planCfg.label} plan.`);
      return;
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!user || !file || selectedFilters.size === 0) return;
    setError(null);

    if (!affordable) {
      setError('Not enough coins. Upgrade your plan or wait for the daily reset.');
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const ext = file.name.split('.').pop();
      const storagePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, file);

      if (uploadError) throw new Error(uploadError.message);

      // Get public URL for the input
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(storagePath);
      const inputUrl = urlData.publicUrl;

      // Create job record
      const filtersArray = [...selectedFilters];
      const { data: jobData, error: jobError } = await supabase
        .from('video_jobs')
        .insert({
          filename: file.name,
          status: 'queued',
          filters_used: filtersArray,
          coins_spent: cost,
          input_storage_path: storagePath,
          file_size_bytes: file.size,
          estimated_wait_seconds: planCfg.queueWaitSeconds,
        })
        .select()
        .single();

      if (jobError) throw new Error(jobError.message);

      // Deduct coins from profile
      const newBalance = (profile?.coins_balance ?? 0) - cost;
      await supabase
        .from('users_profiles')
        .update({ coins_balance: newBalance })
        .eq('id', user.id);

      // Trigger edge function to call Replicate
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            jobId: jobData.id,
            inputUrl,
            filters: filtersArray,
            filename: file.name,
          }),
        });
      } catch {
        // non-blocking — job stays queued, can be retried
      }

      await refreshProfile();

      // Show free user popup
      if (!vip) {
        onShowFreePopup();
      }

      // Reset form
      setFile(null);
      setSelectedFilters(new Set());
      onJobCreated();
      onSwitchTab('queue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start enhancement.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="!text-2xl">Enhance Your Video</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Upload a video, choose your filters, and let AI do the rest.
        </p>
      </div>

      {/* Upload zone */}
      {!file ? (
        <div
          className={`upload-zone rounded-2xl p-10 text-center transition-all ${
            dragOver ? '!border-brand !bg-[#1e293b]' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIME}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15">
            <UploadCloud className="h-8 w-8 text-brand" />
          </div>
          <p className="text-sm font-medium text-ink-primary">
            Drop your video here or click to browse
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {ACCEPTED_FORMATS.join(', ')} · Max {formatFileSize(planCfg.maxFileSizeMB * 1024 * 1024)}
          </p>
        </div>
      ) : (
        <div className="card-panel p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <FileVideo className="h-6 w-6 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-primary">{file.name}</p>
              <p className="text-xs text-ink-muted">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-bg-hover hover:text-error"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Filter cards */}
      <div>
        <h2 className="mb-3 !text-lg">Enhancement Filters</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FILTER_LIST.map((filter) => {
            const selected = selectedFilters.has(filter.id);
            return (
              <div
                key={filter.id}
                className={`filter-card p-4 ${selected ? 'selected' : ''}`}
                onClick={() => toggleFilter(filter.id)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a8a]">
                    <span className="text-lg">{filter.emoji}</span>
                  </div>
                  <span className="coin-badge flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
                    <Coins className="h-3 w-3" />
                    {filter.cost.toFixed(2)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-ink-primary">{filter.label}</h3>
                <p className="mt-1 text-xs text-ink-muted">{filter.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="banner-warning flex items-start gap-3 rounded-lg px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Summary + submit */}
      <div className="card-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted">Total cost</p>
            <p className="text-2xl font-bold text-gradient-gold">{cost.toFixed(2)} coins</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-muted">Your balance</p>
            <p className="text-lg font-semibold text-ink-primary">
              {(profile?.coins_balance ?? 0).toFixed(2)} coins
            </p>
          </div>
        </div>
        <Button
          fullWidth
          size="lg"
          loading={uploading}
          disabled={!file || selectedFilters.size === 0 || !affordable}
          onClick={handleSubmit}
        >
          <Sparkles className="h-5 w-5" />
          Start Enhancement
        </Button>
        {selectedFilters.size === 0 && (
          <p className="mt-2 text-center text-xs text-ink-muted">
            Select at least one filter to continue
          </p>
        )}
        {!affordable && selectedFilters.size > 0 && (
          <p className="mt-2 text-center text-xs text-warning">
            Not enough coins for this combination
          </p>
        )}
      </div>
    </div>
  );
}
