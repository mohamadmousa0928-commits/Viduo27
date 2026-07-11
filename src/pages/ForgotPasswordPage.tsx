import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { AuthShell } from '../components/Navbar';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Logo from '../components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <AuthShell>
      <Card className="glow-brand">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={48} />
          </div>
          <h1 className="!text-2xl">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
        {sent && (
          <div className="mb-4">
            <Alert tone="success">
              Reset link sent. Check your inbox and follow the link to set a new password.
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Send reset link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-secondary">
          Remembered your password?{' '}
          <button onClick={() => navigate('login')} className="link font-medium">
            Sign in
          </button>
        </p>
      </Card>
    </AuthShell>
  );
}
