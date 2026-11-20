import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './src/components/Navbar';
import Footer from './src/components/Footer';
import HomePage from './src/pages/HomePage';
import FeaturesPage from './src/pages/FeaturesPage';
import PricingPage from './src/pages/PricingPage';
import DocsPage from './src/pages/DocsPage';
import BlogPage from './src/pages/BlogPage';
import ContactPage from './src/pages/ContactPage';
import LoginPage from './src/pages/LoginPage';
import RegisterPage from './src/pages/RegisterPage';
import Dashboard from './src/pages/Dashboard';
import AdminPanel from './src/pages/AdminPanel';
import { User, UserRole, SubscriptionPlan, BillingCycle, PlanStatus } from './src/types/types';
import { supabase } from './src/lib/supabase';
import CheckoutPage from './src/pages/CheckoutPage';
import DashboardOverview from './src/components/dashboard/DashboardOverview';
import AIChatPanel from './src/components/dashboard/AIChatPanel';
import DataUpload from './src/components/dashboard/DataUpload';
import InsightsPage from './src/components/dashboard/InsightsPage';
import ReportsPage from './src/components/dashboard/ReportsPage';
import BillingSettings from './src/components/dashboard/BillingSettings';
import SubscriptionAccount from './src/components/dashboard/SubscriptionAccount';
import TestCheckout from './src/pages/TestCheckout';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        mapSupabaseUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = (sbUser: any) => {
    const meta = sbUser.user_metadata || {};
    const plan = meta.subscription || SubscriptionPlan.FREE;

    setUser({
      id: sbUser.id,
      email: sbUser.email || '',
      name: meta.full_name || sbUser.email?.split('@')[0] || 'User',
      role: meta.role || UserRole.USER,
      subscription: plan,
      billingCycle: meta.billingCycle || BillingCycle.MONTHLY,
      planStatus: meta.planStatus || PlanStatus.ACTIVE,
      credits: meta.credits ?? (plan === SubscriptionPlan.FREE ? 10 : 1000),
      maxCredits: meta.maxCredits ?? (plan === SubscriptionPlan.FREE ? 10 : 1000),
      usage: {
        aiQueries: meta.usage?.aiQueries ?? 0,
        documentsUploaded: meta.usage?.documentsUploaded ?? 0,
        storageUsed: meta.usage?.storageUsed ?? 0,
        apiCalls: meta.usage?.apiCalls ?? 0,
        teamMembers: meta.usage?.teamMembers ?? 0,
      },
      features: {
        hasAdvancedAnalytics: meta.features?.hasAdvancedAnalytics ?? false,
        hasPrioritySupport: meta.features?.hasPrioritySupport ?? false,
        hasCustomBranding: meta.features?.hasCustomBranding ?? false,
        hasAPIAccess: meta.features?.hasAPIAccess ?? false,
        hasSSO: meta.features?.hasSSO ?? false,
        hasOnPremise: meta.features?.hasOnPremise ?? false,
        hasCustomModels: meta.features?.hasCustomModels ?? false,
        hasSLA: meta.features?.hasSLA ?? false,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/checkout" element={user ? <CheckoutPage /> : <Navigate to="/login" />} />
            <Route path="/test-checkout" element={<TestCheckout />} />
            
            {/* Dashboard with nested routes */}
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} 
            >
              <Route index element={<DashboardOverview user={user} />} />
              <Route path="ai-chat" element={<AIChatPanel />} />
              <Route path="data-upload" element={<DataUpload />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="billing" element={<BillingSettings user={user} />} />
              <Route path="subscription" element={<SubscriptionAccount user={user} />} />
            </Route>
            
            <Route 
              path="/admin/*" 
              element={user?.role === UserRole.ADMIN ? <AdminPanel /> : <Navigate to="/" />} 
            />
          </Routes>
          
          <button 
            onClick={() => {
              console.log('=== DIAGNOSTICS ===');
              console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
              console.log('Window Origin:', window.location.origin);
              console.log('User:', user);
              
              // Test backend connection
              fetch(`${import.meta.env.VITE_API_URL}/api/health`)
                .then(r => r.json())
                .then(data => console.log('Backend Health:', data))
                .catch(err => console.error('Backend Error:', err));
            }}
            className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs z-50"
          >
            🔧 Diagnostics
          </button>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;