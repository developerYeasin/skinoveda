import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { trackPageView } from './api/tracking';

/* public */
import Home from './pages/Home';
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'));
const About = lazy(() => import('./pages/About'));
const Team = lazy(() => import('./pages/Team'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const NotFound = lazy(() => import('./pages/NotFound'));

/* admin */
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Realtime = lazy(() => import('./pages/admin/Realtime'));
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminTeam = lazy(() => import('./pages/admin/Team'));
const AdminGallery = lazy(() => import('./pages/admin/Gallery'));
const AdminMedia = lazy(() => import('./pages/admin/Media'));
const AdminBlogs = lazy(() => import('./pages/admin/Blogs'));
const AdminTestimonials = lazy(() => import('./pages/admin/Testimonials'));
const AdminMessages = lazy(() => import('./pages/admin/Messages'));
const AdminSubscribers = lazy(() => import('./pages/admin/Subscribers'));
const AdminTracking = lazy(() => import('./pages/admin/Tracking'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

function Loader() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ borderColor: 'rgba(122,45,142,.25)', borderTopColor: '#5C1A6E', width: 32, height: 32, margin: '0 auto 14px' }} />
        <p className="muted">Loading…</p>
      </div>
    </div>
  );
}

function RouteTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!pathname.startsWith('/admin')) {
      const t = setTimeout(() => trackPageView(pathname + search, document.title), 300);
      return () => clearTimeout(t);
    }
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <>
      <RouteTracker />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/category/:slug" element={<CategoryDetail />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/our-team" element={<Team />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="realtime" element={<Realtime />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="subscribers" element={<AdminSubscribers />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
