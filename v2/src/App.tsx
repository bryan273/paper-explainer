import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PrefsProvider } from '@/lib/prefs';
import { AccountProvider } from '@/lib/account';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { AuthDialog } from '@/components/site/AuthDialog';
import { SupportChat } from '@/components/site/SupportChat';
import { AppLayout } from '@/components/app/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const Landing = lazy(() => import('@/pages/Landing'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Help = lazy(() => import('@/pages/Help'));
const Legal = lazy(() => import('@/pages/Legal'));
const Home = lazy(() => import('@/pages/app/Home'));
const NewVideo = lazy(() => import('@/pages/app/NewVideo'));
const LibraryPage = lazy(() => import('@/pages/app/Library'));
const Watch = lazy(() => import('@/pages/app/Watch'));
const Read = lazy(() => import('@/pages/app/Read'));
const Check = lazy(() => import('@/pages/app/Check'));
const AccountPage = lazy(() => import('@/pages/app/Account'));
const Admin = lazy(() => import('@/pages/app/Admin'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function Spinner() {
  return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
}
function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) { window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80); return; }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
function Marketing() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<Spinner />}><Outlet /></Suspense>
      <SiteFooter />
    </>
  );
}
/** Old share links (?job=<id>) open the video. */
function LegacyJob() {
  const [q] = useSearchParams();
  const id = q.get('job');
  return id ? <Navigate to={`/app/v/${id}`} replace /> : <Landing />;
}

export default function App() {
  return (
    <PrefsProvider>
      <AccountProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <ScrollTop />
            <Routes>
              <Route element={<Marketing />}>
                <Route index element={<LegacyJob />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="help" element={<Help />} />
                <Route path="terms" element={<Legal kind="terms" />} />
                <Route path="privacy" element={<Legal kind="privacy" />} />
              </Route>
              <Route path="app" element={<AppLayout />}>
                <Route index element={<Suspense fallback={<Spinner />}><Home /></Suspense>} />
                <Route path="new" element={<Suspense fallback={<Spinner />}><NewVideo /></Suspense>} />
                <Route path="library" element={<Suspense fallback={<Spinner />}><LibraryPage /></Suspense>} />
                <Route path="v/:id" element={<Suspense fallback={<Spinner />}><Watch /></Suspense>} />
                <Route path="read" element={<Suspense fallback={<Spinner />}><Read /></Suspense>} />
                <Route path="check" element={<Suspense fallback={<Spinner />}><Check /></Suspense>} />
                <Route path="account" element={<Suspense fallback={<Spinner />}><AccountPage /></Suspense>} />
                <Route path="admin" element={<Suspense fallback={<Spinner />}><Admin /></Suspense>} />
              </Route>
              <Route path="*" element={<Suspense fallback={<Spinner />}><NotFound /></Suspense>} />
            </Routes>
            <AuthDialog />
            <SupportChat />
            <Toaster position="top-center" />
          </BrowserRouter>
        </TooltipProvider>
      </AccountProvider>
    </PrefsProvider>
  );
}
