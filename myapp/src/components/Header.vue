<script setup>
import { onMounted, ref, computed, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import ThemeToggle from '@/components/ThemeToggle.vue'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useRouter } from 'vue-router';
import { Bell, Mail, LogOut, User, Home, Menu, X, ChevronDown, ChevronRight } from 'lucide-vue-next';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const { selectedGroup, customerGroups  } = storeToRefs(settingsStore);
const { username } = storeToRefs(authStore);
const isMobileMenuOpen = ref(false);
const expandedMobileMenus = ref({});

// Track current route for active state
const currentRoute = computed(() => router.currentRoute.value.path);
const selectedGroupDisplay = computed(() => {
  if (!selectedGroup.value || !customerGroups.value) return 'Select a customer';
  const group = customerGroups.value.find(g => g.id === selectedGroup.value);
  return group ? group.name : 'Select a customer';
});

const mainNavItems = [
  { label: 'Map', to: '/map' },
  { 
    label: 'Resources',
    isMegaMenu: true,
    columns: [
      { items: [{ title: 'Vehicles', to: '/vehicles' }, { title: 'Trailers', to: '/trailers' }] },
      { items: [{ title: 'Drivers', to: '/drivers' }] },
      { items: [{ title: 'Groups', to: '/groups' }, { title: 'Workshops', to: '/workshops' }] }
    ]
  },
  { 
    label: 'Reports',
    isMegaMenu: true,
    columns: [
      { title: 'TRIP', items: [{ title: 'Trips', to: '#' }, { title: 'Trip Analysis', to: '#' }] },
      { title: 'USAGE', items: [{ title: 'Fleet Utilisation', to: '#' }, { title: 'Vehicle Activity', to: '#' }] },
      { title: 'DEALER', items: [{ title: 'Maintenance', to: '#' }, { title: 'Damage', to: '#' }] },
    ]
  },
  {
    label: 'Tools',
    isMegaMenu: true,
    columns: [
      { items: [{ title: 'Geofences', to: '/geofences' }, { title: 'Monitoring', to: '/monitoring' }, { title: 'Services', to: '/services' }] },
      { items: [{ title: 'Settings', to: '/settings' }, { title: 'Perform check', to: '/pdc' }] },
      { items: [{ title: 'About', to: '/about' }] }
    ]
  },
];

const handleLogout = async () => {  
  await authStore.logout();  
  closeMobileMenu();
};

const handleGroupChange = async (groupId) => {
  if (groupId) {
    // Parse to int if it's a string from select element
    const customerId = typeof groupId === 'string' ? parseInt(groupId, 10) : groupId;
    
    try {
      // This will update the session on the server
      await settingsStore.setSelectedGroup(customerId);
    } catch (error) {
      console.error('Failed to switch customer:', error);
      // Optionally show an error toast/notification here
    }
  }
};

const toggleMobileSubmenu = (label) => {
  expandedMobileMenus.value[label] = !expandedMobileMenus.value[label];
};

const navigateAndClose = (to) => {
  if (to && to !== '#') {
    router.push(to);
    closeMobileMenu();
  }
};

const openMobileMenu = () => {
  isMobileMenuOpen.value = true;
  // Prevent body scroll when menu is open
  document.body.style.overflow = 'hidden';
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  expandedMobileMenus.value = {};
  // Re-enable body scroll
  document.body.style.overflow = '';
};

// Close menu on escape key
const handleEscape = (e) => {
  if (e.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu();
  }
};

onMounted(() => {
//  if (!selectedGroup.value && authStore.customerId) {
//    settingsStore.setSelectedGroup(authStore.customerId);
//  }
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = ''; // Clean up
});
</script>

<template>
  <header class="sticky top-0 z-50 w-full ">
    <nav class="container-full mx-auto px-4">
      <div class="flex h-16 items-center justify-between">
        <!-- Left side: Logo and Desktop Navigation -->
        <div class="flex items-center gap-x-6">
          <!-- Logo -->
          <router-link to="/dashboard" class="flex items-center space-x-2 shrink-0">
            <img src="/logo.svg" alt="Site Logo" class="h-8 w-8">
            <span class="text-xl font-bold">{{ settingsStore.siteName }}</span>
          </router-link>

          <!-- Desktop Navigation (hidden on mobile/tablet) -->
          <NavigationMenu class="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem v-for="item in mainNavItems" :key="item.label">
                <!-- Direct link -->
                <router-link v-if="item.to" :to="item.to" :class="navigationMenuTriggerStyle()">
                  <span>{{ item.label }}</span>
                </router-link>

                <!-- Dropdown menu -->
                <template v-else>
                  <NavigationMenuTrigger>{{ item.label }}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div v-if="item.isMegaMenu" class="grid w-[600px] grid-cols-3 gap-x-8 p-4">
                      <div v-for="col in item.columns" :key="col.title">
                        <h3 v-if="col.title" class=" font-bold text-gray-500">{{ col.title }}</h3>
                        <ul>
                          <li v-for="subItem in col.items" :key="subItem.title">
                            <router-link 
                              :to="subItem.to || '#'" 
                              class="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-primary"
                            >
                              {{ subItem.title }}
                            </router-link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </template>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <!-- Right side: User menu and mobile trigger -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-2 sm:gap-4">
          <!-- Desktop-only items container (hidden when hamburger is visible) -->
          <div class="hidden lg:flex items-center gap-4">
            <!-- Group Selector -->
            <Select 
              v-if="customerGroups.length > 0" 
              :model-value="selectedGroup?.toString()"
              @update:modelValue="handleGroupChange"
            ><i class="fa-light fa-building-magnifying-glass"></i>
              <SelectTrigger class="w-[180px] xl:w-[220px] card">
                <SelectValue>
                  {{ selectedGroupDisplay }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem 
                    v-for="group in customerGroups" 
                    :key="group.id" 
                    :value="group.id.toString()"
                    class="cursor-pointer hover:bg-slate-200 rounded-md"
                  >
                    {{ group.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>            
            
            <!-- Notification icons -->
            <Button variant="ghost" size="icon" class="relative h-9 w-9">
              <i class="fa-light fa-bell"></i>
              <Badge class="absolute -top-1 -right-1 h-4 w-4 justify-center  p-0 text-xs">2</Badge>
            </Button>
            <Button variant="ghost" size="icon" class="h-9 w-9"><i class="fa-regular fa-envelope"></i></Button>
            
            <!-- User Dropdown -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="font-semibold">
                  <span class="hidden xl:inline">{{ authStore.userName }}</span>
                  <User class="ml-0 xl:ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem >
                  <Mail class="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User class="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleLogout">
                  <LogOut class="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- Mobile Menu Trigger - Only shows on mobile/tablet -->
          <Button @click="openMobileMenu" variant="ghost" size="icon" class="lg:hidden">
            <Menu class="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="isMobileMenuOpen" 
          @click="closeMobileMenu"
          class="fixed inset-0 bg-black/50 z-[100] lg:hidden"
        />
      </Transition>

      <!-- Mobile Menu Panel -->
      <Transition name="slide">
        <div 
          v-if="isMobileMenuOpen"
          class="fixed top-0 right-0 h-full w-[300px] sm:w-[350px] bg-white shadow-xl z-[101] lg:hidden overflow-y-auto"
        >
          <!-- Mobile Menu Header -->
          <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
            <h2 class="font-semibold text-lg">Menu</h2>
            <Button @click="closeMobileMenu" variant="ghost" size="icon">
              <X class="h-5 w-5" />
            </Button>
          </div>

          <!-- User Info Section -->
          <div class="border-b px-4 py-4 bg-gray-50">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User class="h-5 w-5" />
              </div>
              <div class="flex-1">
                <p class="font-semibold text-sm">{{ authStore.userName }}</p>
                <p class="text-xs text-gray-600">{{ authStore.userEmail || 'user@example.com' }}</p>
              </div>
            </div>
            
            <!-- Group Selector for Mobile - Using native select for better mobile support -->
            <div v-if="settingsStore.customerGroups.length > 0" class="mt-4">
              <label class="block text-xs font-medium text-gray-700 mb-1">Select Group</label>
              <select 
                :value="String(settingsStore.selectedGroup)"
                @change="handleGroupChange($event.target.value)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option 
                  v-for="group in settingsStore.customerGroups" 
                  :key="group.id" 
                  :value="String(group.id)"
                >
                  {{ group.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Navigation Items -->
          <div class="px-4 py-4 space-y-1">
            <div v-for="item in mainNavItems" :key="item.label">
              <!-- Direct Link -->
              <button
                v-if="item.to"
                @click="navigateAndClose(item.to)"
                class="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                :class="{ 'bg-gray-100': currentRoute === item.to }"
              >
                <span class="font-medium">{{ item.label }}</span>
              </button>

              <!-- Expandable Menu -->
              <div v-else>
                <button
                  @click="toggleMobileSubmenu(item.label)"
                  class="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span class="font-medium">{{ item.label }}</span>
                  <ChevronDown 
                    :size="20" 
                    :class="{ 'rotate-180': expandedMobileMenus[item.label] }"
                    class="transition-transform duration-200 text-gray-400"
                  />
                </button>
                
                <!-- Submenu Items -->
                <Transition name="expand">
                  <div
                    v-if="expandedMobileMenus[item.label]"
                    class="mt-1 ml-4 space-y-1"
                  >
                    <div v-for="col in item.columns" :key="col.title">
                      <div v-if="col.title" class="text-xs font-semibold text-gray-500 px-3 py-1 uppercase">
                        {{ col.title }}
                      </div>
                      <button
                        v-for="subItem in col.items"
                        :key="subItem.title"
                        @click="navigateAndClose(subItem.to)"
                        class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm"
                        :class="{ 'bg-gray-50': currentRoute === subItem.to }"
                      >
                        {{ subItem.title }}
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="border-t px-4 py-4 space-y-2">
            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell class="h-4 w-4" />
              <span>Notifications</span>
              <Badge class="ml-auto">2</Badge>
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Mail class="h-4 w-4" />
              <span>Messages</span>
            </button>
          </div>

          <!-- Bottom Actions -->
          <div class="border-t px-4 py-4 space-y-2">
            <button class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <User class="h-4 w-4" />
              <span>Profile</span>
            </button>
            <button 
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <LogOut class="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition for menu panel */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Expand transition for submenus */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Ensure smooth scrolling on mobile */
@media (max-width: 1024px) {
  body.menu-open {
    overflow: hidden;
  }
}

/* Fix for iOS rubber band scrolling */
.mobile-menu-panel {
  -webkit-overflow-scrolling: touch;
}
</style>