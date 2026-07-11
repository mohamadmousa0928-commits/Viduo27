import { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { useRouter, navigate } from './lib/router';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import SubscriptionPage from './pages/SubscriptionPage';

function Routes() {
  const { route } = useRouter();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already signed in and hitting auth pages
  useEffect(() => {
    if (!loading && user && (route.name === 'login' || route.name === 'register' || route.name === 'forgot-password')) {
      navigate('dashboard');
    }
  }, [user, loading, route.name]);

  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'register':
      return <RegisterPage />;
    case 'login':
      return <LoginPage />;
    case 'verify-email':
      return <VerifyEmailPage />;
    case 'forgot-password':
      return <ForgotPasswordPage />;
    case 'reset-password':
      return <ResetPasswordPage />;
    case 'profile':
      return <ProfilePage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'pricing':
      return <PricingPage preselect={route.plan} />;
    case 'checkout':
      return <CheckoutPage planId={route.plan} />;
    case 'subscription':
      return <SubscriptionPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
