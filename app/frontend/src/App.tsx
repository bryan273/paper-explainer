import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import BlogRoutes from './blog-routes';
import Admin from './pages/Admin';
import Index from './pages/Index';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
import Account from './pages/Account';
import Legal from './pages/Legal';
import { AccountProvider } from './lib/account';
import { AuthModal } from './components/AccountUI';
// MODULE_IMPORTS_START
import NotFound from './components/NotFound';
import { PrefsProvider } from './lib/prefs';
// MODULE_IMPORTS_END

const queryClient = new QueryClient();

/** arxivisual-style link: /abs/1706.03762 opens that paper (its videos if they exist, otherwise the form filled in). */
const AbsPage = () => {
  const { id = '' } = useParams();
  return <Navigate to={`/?paper=${encodeURIComponent(id)}#make`} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    {/* <Route path="/blog/*" element={<BlogRoutes />} /> */}
    <Route path="/console" element={<Admin />} />
    <Route path="/abs/:id" element={<AbsPage />} />
    <Route path="/account" element={<Account />} />
    <Route path="/terms" element={<Legal kind="terms" />} />
    <Route path="/privacy" element={<Legal kind="privacy" />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />
    <Route path="*" element={<NotFound appId="explainer" />} />
    {/* MODULE_ROUTES_START */}
    {/* MODULE_ROUTES_END */}
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* MODULE_PROVIDERS_START */}
    {/* MODULE_PROVIDERS_END */}
    <PrefsProvider>
    <AccountProvider>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppRoutes />
        <AuthModal />
      </BrowserRouter>
    </TooltipProvider>
    </AccountProvider>
    </PrefsProvider>
    {/* MODULE_PROVIDERS_CLOSE */}
  </QueryClientProvider>
);

export default App;
export { AppRoutes };
