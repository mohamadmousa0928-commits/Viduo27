import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { AuthShell } from '../components/Navbar';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Logo from '../components/Logo';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => navigate('profile'), 2000);
  }

  return (
    <AuthShell>
      <Card className="glow-brand">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={48} />
          </div>
          <h1 className="!text-2xl">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Choose a strong password for your account.
          </p>
        </div>

        {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}
        {done && (
          <div className="mb-4">
            <Alert tone="success">
              Password updated. Redirecting to your profile…
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="Re-enter password"
            icon={<Lock className="h-4 w-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={loading} disabled={done}>
            Update password
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
