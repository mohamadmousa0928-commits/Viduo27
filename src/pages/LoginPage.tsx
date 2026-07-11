import { useState, type FormEvent } from 'react';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { AuthShell } from '../components/Navbar';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Logo from '../components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate('profile');
  }

  return (
    <AuthShell>
      <Card className="glow-brand">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={48} />
          </div>
          <h1 className="!text-2xl">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Sign in to continue enhancing your videos.
          </p>
        </div>

        {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}

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
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('forgot-password')}
              className="text-xs text-ink-link hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-secondary">
          Don't have an account?{' '}
          <button onClick={() => navigate('register')} className="link font-medium">
            Create one
          </button>
        </p>
      </Card>
    </AuthShell>
  );
}
