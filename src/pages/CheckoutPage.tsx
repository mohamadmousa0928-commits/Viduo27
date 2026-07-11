import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Loader2,
  Shield,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { navigate } from '../lib/router';
import { PLAN_CONFIG, type PlanId } from '../lib/coins';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Alert from '../components/Alert';

type PaymentMethod = 'paypal' | 'visa' | 'mastercard' | 'google_play';

const METHODS: { id: PaymentMethod; label: string; logo: string }[] = [
  { id: 'paypal', label: 'PayPal', logo: '🅿️' },
  { id: 'visa', label: 'Visa', logo: '💳' },
  { id: 'mastercard', label: 'Mastercard', logo: '💳' },
  { id: 'google_play', label: 'Google Play', logo: '▶️' },
];

// PayPal SDK script loader
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

function usePayPalSdk() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || document.getElementById('paypal-sdk')) {
      setLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);
  return loaded;
}

export default function CheckoutPage({ planId }: { planId?: string }) {
  const { user, refreshProfile } = useAuth();
  const paypalLoaded = usePayPalSdk();
  const [method, setMethod] = useState<PaymentMethod>('paypal');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalRenderedRef = useRef(false);

  const validPlan = (planId ?? 'weekly') as PlanId;
  const plan = PLAN_CONFIG[validPlan];

  const activatePlan = useCallback(async () => {
    if (!user) return;
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            plan: validPlan,
            method,
            amount: plan.price,
            coinsAdded: plan.coins,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? `Payment failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? 'Payment activation failed');
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => navigate('subscription'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [user, method, validPlan, plan, refreshProfile]);

  // Render PayPal buttons when SDK is loaded and method is PayPal
  useEffect(() => {
    if (!paypalLoaded || !window.paypal || paypalRenderedRef.current) return;
    if (method !== 'paypal' || !paypalContainerRef.current) return;

    paypalRenderedRef.current = true;
    window.paypal
      .Buttons({
        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
        createOrder: (_data: unknown, actions: { order: { create: (opts: unknown) => Promise<string> } }) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: plan.price.toFixed(2), currency_code: 'USD' },
                description: `${plan.label} — ${plan.coins} coins`,
              },
            ],
          });
        },
        onApprove: async () => {
          await activatePlan();
        },
        onError: (err: unknown) => {
          setError('PayPal payment failed. Please try again.');
          console.error('PayPal error:', err);
        },
      })
      .render(paypalContainerRef.current);
  }, [paypalLoaded, method, plan, activatePlan]);

  // Reset rendered flag when switching away from PayPal
  useEffect(() => {
    if (method !== 'paypal') {
      paypalRenderedRef.current = false;
      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = '';
      }
    }
  }, [method]);

  if (!user) {
    navigate('login');
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="!text-2xl">Payment Successful!</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Your <strong className="text-ink-primary">{plan.label}</strong> is now active with{' '}
            <strong className="text-gold">{plan.coins} coins</strong>. Redirecting to your
            subscription page…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <button
          onClick={() => navigate('pricing')}
          className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plans
        </button>

        <h1 className="!text-2xl">Checkout</h1>
        <p className="mt-1 text-sm text-ink-secondary">Complete your subscription purchase.</p>

        {/* Plan summary */}
        <div className="card-panel mt-6 p-5">
          <h2 className="mb-4 !text-lg">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">Plan</span>
              <span className="text-sm font-semibold text-ink-primary">{plan.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">Coins included</span>
              <span className="text-sm font-semibold text-gold">{plan.coins} coins</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">Queue type</span>
              <span className="text-sm text-ink-secondary">{plan.queueLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">Max file size</span>
              <span className="text-sm text-ink-secondary">
                {plan.maxFileSizeMB >= 1024 ? `${plan.maxFileSizeMB / 1024}GB` : `${plan.maxFileSizeMB}MB`}
              </span>
            </div>
            <div className="border-t border-gray-800/60 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-ink-primary">Total</span>
                <span className="text-2xl font-bold text-ink-primary">{plan.priceLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="mt-6">
          <h2 className="mb-3 !text-lg">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {METHODS.map((m) => {
              const selected = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
                    selected
                      ? 'border-brand bg-[#1e3a5f] shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'border-gray-700 bg-bg-secondary hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl">{m.logo}</span>
                  <span className={`text-xs font-medium ${selected ? 'text-ink-primary' : 'text-ink-secondary'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        {/* Payment area */}
        <div className="card-panel mt-6 p-5">
          {/* PayPal button */}
          {method === 'paypal' && (
            <div>
              {!PAYPAL_CLIENT_ID ? (
                <div className="text-center">
                  <Alert tone="info">
                    PayPal client ID not configured. You can still complete the checkout —
                    the payment will be processed in demo mode.
                  </Alert>
                  <Button fullWidth className="mt-4" loading={processing} onClick={activatePlan}>
                    Pay with PayPal (Demo)
                  </Button>
                </div>
              ) : !paypalLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                </div>
              ) : (
                <div ref={paypalContainerRef} />
              )}
            </div>
          )}

          {/* Visa / Mastercard via PayPal */}
          {(method === 'visa' || method === 'mastercard') && (
            <div>
              <p className="mb-3 text-sm text-ink-secondary">
                Pay with your {method === 'visa' ? 'Visa' : 'Mastercard'} credit or debit card
                securely via PayPal.
              </p>
              {!PAYPAL_CLIENT_ID ? (
                <Button fullWidth loading={processing} onClick={activatePlan}>
                  <CreditCard className="h-4 w-4" />
                  Pay {plan.priceLabel} (Demo)
                </Button>
              ) : (
                <Button fullWidth loading={processing} onClick={activatePlan}>
                  <CreditCard className="h-4 w-4" />
                  Pay {plan.priceLabel}
                </Button>
              )}
            </div>
          )}

          {/* Google Play */}
          {method === 'google_play' && (
            <div>
              <p className="mb-3 text-sm text-ink-secondary">
                Pay using your Google Play account balance. This will redirect to Google Play
                Billing on mobile devices.
              </p>
              <Button fullWidth loading={processing} onClick={activatePlan}>
                <span className="text-base">▶️</span>
                Pay with Google Play
              </Button>
            </div>
          )}

          {/* Security note */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <Shield className="h-3.5 w-3.5" />
            Secure payment · 256-bit SSL encryption
          </div>
        </div>
      </div>
    </div>
  );
}
