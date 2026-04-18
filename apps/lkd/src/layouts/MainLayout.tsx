import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';

export default function MainLayout() {
  const location = useLocation();
  const isPrintPage = location.pathname === '/lkh/laporan'; // Hide nav on print page
  const isEditorPage = location.pathname === '/tugas/editor'; // Hidden on desktop, visible on mobile

  return (
    <ErrorBoundary>
      <Outlet />
      {!isPrintPage && <BottomNav isEditorPage={isEditorPage} />}
      <Toast />
    </ErrorBoundary>
  );
}
