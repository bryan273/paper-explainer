import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BlogRoutes from './blog-routes';
import Admin from './pages/Admin';
import Index from './pages/Index';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
// MODULE_IMPORTS_START
import { PrefsProvider } from './lib/prefs';
// MODULE_IMPORTS_END

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    {/* <Route path="/blog/*" element={<BlogRoutes />} /> */}
    <Route path="/admin" element={<Admin />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />
    {/* MODULE_ROUTES_START */}
    {/* MODULE_ROUTES_END */}
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* MODULE_PROVIDERS_START */}
    {/* MODULE_PROVIDERS_END */}
    <PrefsProvider>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
    </PrefsProvider>
    {/* MODULE_PROVIDERS_CLOSE */}
  </QueryClientProvider>
);

export default App;
export { AppRoutes };
