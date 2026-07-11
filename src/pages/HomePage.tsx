import {
  Sparkles,
  Video,
  Coins,
  Crown,
  Zap,
  Shield,
  ArrowRight,
  Check,
} from 'lucide-react';
import { navigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import Button from '../components/Button';
import Card from '../components/Card';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.25), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.2), transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Video Enhancement
          </div>
          <h1 className="!text-4xl sm:!text-5xl">
            Enhance your videos with{' '}
            <span className="text-gradient-gold">AI magic</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-secondary">
            Upscale, denoise, stabilize, and transform your videos in seconds.
            Start with 2.50 free coins — no credit card needed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate(user ? 'dashboard' : 'register')} size="lg">
              {user ? 'Go to dashboard' : 'Get started free'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('login')}>
              {user ? 'View profile' : 'Sign in'}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card hover>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15">
              <Zap className="h-6 w-6 text-brand" />
            </div>
            <h2 className="!text-lg">Lightning fast</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              AI enhancement completes in seconds, not hours.
            </p>
          </Card>
          <Card hover>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15">
              <Coins className="h-6 w-6 text-gold" />
            </div>
            <h2 className="!text-lg">Coin-based credits</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Pay only for what you use. Top up anytime with flexible plans.
            </p>
          </Card>
          <Card hover>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success/15">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <h2 className="!text-lg">Secure & private</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Your videos are processed securely and never shared.
            </p>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center !text-3xl">How it works</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { icon: <Video className="h-6 w-6" />, step: '01', title: 'Upload', desc: 'Upload any video file from your device.' },
            { icon: <Sparkles className="h-6 w-6" />, step: '02', title: 'Enhance', desc: 'Choose filters and let AI do the work.' },
            { icon: <ArrowRight className="h-6 w-6" />, step: '03', title: 'Download', desc: 'Get your enhanced video instantly.' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                {s.icon}
              </div>
              <p className="mb-1 text-xs font-bold text-brand">{s.step}</p>
              <h3 className="!text-lg">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center !text-3xl">Simple, transparent pricing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Free', price: '$0', coins: '2.50 coins', features: ['Starter balance', 'Basic filters', 'Standard speed'], highlight: false },
            { name: 'Weekly', price: '$4.99', coins: '25 coins/wk', features: ['All filters', 'Priority queue', 'Email support'], highlight: false },
            { name: 'Monthly', price: '$14.99', coins: '120 coins/mo', features: ['All filters', 'Priority queue', 'Email support', '20% coin bonus'], highlight: true },
            { name: 'Yearly', price: '$99.99', coins: '1500 coins/yr', features: ['Everything in Monthly', 'VIP badge', 'Dedicated support', '40% coin bonus'], highlight: false },
          ].map((plan) => (
            <Card
              key={plan.name}
              hover
              className={plan.highlight ? 'glow-brand border-brand/40' : ''}
            >
              {plan.highlight && (
                <span className="vip-gradient mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white">
                  <Crown className="mr-1 inline h-3 w-3" /> Best value
                </span>
              )}
              <h3 className="!text-lg">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold text-ink-primary">{plan.price}</p>
              <p className="mt-1 text-sm text-gold">{plan.coins}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? 'vip' : 'ghost'}
                fullWidth
                className="mt-6"
                onClick={() => navigate(user ? 'pricing' : 'register')}
              >
                Choose {plan.name}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Card className="glow-brand text-center">
          <h2 className="!text-2xl">Ready to enhance your first video?</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Sign up now and get 2.50 free coins to start.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate('register')}>
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-xs text-ink-muted">
            © 2026 VidEnhance AI. Built with AI-powered enhancement.
          </p>
        </div>
      </footer>
    </div>
  );
}
