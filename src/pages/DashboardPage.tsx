import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { navigate } from '../lib/router';
import DashboardLayout, { type TabId } from '../components/dashboard/DashboardLayout';
import EnhanceTab from '../components/dashboard/EnhanceTab';
import QueueTab from '../components/dashboard/QueueTab';
import DownloadTab from '../components/dashboard/DownloadTab';
import HistoryTab from '../components/dashboard/HistoryTab';
import FreeLimitPopup from '../components/dashboard/FreeLimitPopup';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('enhance');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFreePopup, setShowFreePopup] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('login');
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const handleJobCreated = () => setRefreshKey((k) => k + 1);

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'enhance' && (
        <EnhanceTab
          onJobCreated={handleJobCreated}
          onSwitchTab={setActiveTab}
          onShowFreePopup={() => setShowFreePopup(true)}
        />
      )}
      {activeTab === 'queue' && <QueueTab refreshKey={refreshKey} />}
      {activeTab === 'download' && <DownloadTab refreshKey={refreshKey} />}
      {activeTab === 'history' && <HistoryTab refreshKey={refreshKey} />}

      <FreeLimitPopup
        open={showFreePopup}
        onClose={() => setShowFreePopup(false)}
        onUpgrade={() => {
          setShowFreePopup(false);
          navigate('pricing');
        }}
      />
    </DashboardLayout>
  );
}
