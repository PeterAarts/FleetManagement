import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

// Import Layouts and Views
import MainLayout from '@/layouts/MainLayout.vue';
import AuthView from '@/views/AuthView.vue';
import DashboardView from '@/views/DashboardView.vue';
import VehiclesView from '@/views/VehiclesView.vue';
import MapView from '@/views/MapView.vue';
import DebugView from '@/views/DebugView.vue';
import NotFound from '@/views/NotFound.vue';

const routes = [
  // This route is for unauthenticated users
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
    meta: { requiresGuest: true } 
  },
  
  // This is the parent route for all authenticated pages.
  // It uses the MainLayout, which contains the header.
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard', 
    meta: { requiresAuth: true }, // Protects the layout and all its children
    children: [
      { path: 'dashboard',    name: 'dashboard',    component: DashboardView },
      { path: 'map',          name: 'map',          component: MapView },
      { path: 'vehicles',     name: 'vehicles',     component: VehiclesView },
      { path: 'trailers',     name: 'trailers',     component: { template: '<div>Trailers Page</div>' }},
      { path: 'drivers',      name: 'drivers',      component: { template: '<div>Drivers Page</div>' }},
      { path: 'debug/token',  name: 'TokenDebug',   component: () => import('@/views/TokenDebug.vue'), meta: { requiresAuth: false }},
      { path: 'debug',        name: 'debug',        component: DebugView },
    ]
  },
  
  // 404 catch-all route - MUST BE LAST and OUTSIDE the MainLayout
  // This catches ALL unmatched routes at the root level
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- GLOBAL NAVIGATION GUARD ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const settingsStore = useSettingsStore();

  // Allow 404 page without authentication
  if (to.name === 'NotFound') {
    return next();
  }

  // Prevent infinite loops - if already going to auth page, don't redirect again
  if (to.name === 'auth') {
    return next();
  }

  // On every route, try to restore session from localStorage
  authStore.tryAutoLogin();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // If route requires auth and user is not logged in, redirect
    settingsStore.clearSettings();
    return next({ name: 'auth' });
  }
  
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // If route is for guests and user is logged in, redirect
    return next({ name: 'dashboard' });
  }

  // If the user is authenticated but settings are missing, fetch them
  if (authStore.isAuthenticated && !settingsStore.settings) {
    try {
      await authStore.fetchSessionInfo();
      await settingsStore.fetchSettings();
    } catch (error) {
      authStore.logout('expired');
      return next({ name: 'auth', query: { reason: 'session-expired' }});
    }
  }

  // Optional: Log 404 attempts for debugging
  if (to.name === 'NotFound') {
    console.warn(`404: User attempted to access ${to.fullPath}`);
  }

  next();
});

export default router;