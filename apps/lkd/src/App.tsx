import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import EditorAktivitas from './pages/EditorAktivitas';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import InputLkh from './pages/InputLkh';
import Jadwal from './pages/JadwalMengajar';
import Profil from './pages/Profil';
import LaporanBulanan from './pages/LaporanBulanan';
import RiwayatLkh from './pages/RiwayatLkh';
import Login from './pages/Login';
import KalenderAkademik from './pages/KalenderAkademik';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserDetail from './pages/admin/AdminUserDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes — Tidak menggunakan MainLayout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lkh/input" element={<InputLkh />} />
          <Route path="/lkh/riwayat" element={<RiwayatLkh />} />
          <Route path="/lkh/laporan" element={<LaporanBulanan />} />
          <Route path="/jadwal" element={<Jadwal />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/tugas" element={<EditorAktivitas />} />
          <Route path="/kalender" element={<KalenderAkademik />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
