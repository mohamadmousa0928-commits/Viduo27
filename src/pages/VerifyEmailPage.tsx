import { useEffect, useState } from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { AuthShell } from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll session — when user clicks the email link, the session becomes verified
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email_confirmed_at) {
        clearInterval(interval);
        navigate('profile');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleResend() {
    setResending(true);
    setError(null);
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email;
    if (!email) {
      setError('No session found. Please sign up again.');
      setResending(false);
      return;
    }
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }
    setResending(false);
  }

  return (
    <AuthShell>
      <Card className="glow-brand text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand">
            <MailCheck className="h-8 w-8" />
          </div>
        </div>
        <h1 className="!text-2xl">Check your inbox</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          We sent a verification link to your email. Click it to activate your
          account and start using VidEnhance AI.
        </p>

        {error && <div className="mt-4 text-left"><Alert tone="error">{error}</Alert></div>}
        {resent && (
          <div className="mt-4 text-left">
            <Alert tone="success">Verification email re-sent. Check your inbox.</Alert>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button variant="ghost" fullWidth loading={resending} onClick={handleResend}>
            <RefreshCw className="h-4 w-4" />
            Resend verification email
          </Button>
          <button
            onClick={() => navigate('login')}
            className="text-sm text-ink-link hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </Card>
    </AuthShell>
  );
}
