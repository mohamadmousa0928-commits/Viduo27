import { useState, type FormEvent } from 'react';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { AuthShell } from '../components/Navbar';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Logo from '../components/Logo';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if ( signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Send welcome email via edge function
    if (data.user) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'welcome',
            email,
            name: name || email,
          }),
        });
      } catch {
        // non-blocking
      }
    }

    setLoading(false);
    navigate('verify-email');
  }

  return (
    <AuthShell>
      <Card className="glow-brand">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={48} />
          </div>
          <h1 className="!text-2xl">Create your account</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Start with 2.50 free coins — no card required.
          </p>
        </div>

        {error && <div className="mb-4"><Alert tone="error">{error}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            icon={<UserIcon className="h-4 w-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            placeholder="At least 8 characters"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter password"
            icon={<Lock className="h-4 w-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <Button type="submit" fullWidth loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-secondary">
          Already have an account?{' '}
          <button onClick={() => navigate('login')} className="link font-medium">
            Sign in
          </button>
        </p>
      </Card>
    </AuthShell>
  );
}
