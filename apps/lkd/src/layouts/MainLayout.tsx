import { Outlet, useLocation, Navigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAppStore } from '../store/useAppStore';
import OfflineIndicator from '../components/OfflineIndicator';

import Sidebar from '../components/Sidebar';
import BantuanModal from '../components/BantuanModal';

export default function MainLayout() {
  const location = useLocation();
  const isLoggedIn = useAppStore(state => state.isLoggedIn);
  
  const isPrintPage = location.pathname === '/lkh/laporan'; // Hide nav on print page
  const isEditorPage = location.pathname === '/tugas/editor'; // Hidden on desktop, visible on mobile

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      <Sidebar />
      <BantuanModal />
      <Outlet />
      {!isPrintPage && <BottomNav isEditorPage={isEditorPage} />}
      <Toast />
    </ErrorBoundary>
  );
}
