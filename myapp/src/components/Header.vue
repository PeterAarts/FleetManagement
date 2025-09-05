<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useRouter } from 'vue-router';
import { Bell, Mail, LogOut, User } from 'lucide-vue-next';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const { selectedGroup, groups } = storeToRefs(settingsStore);
const { username } = storeToRefs(authStore);

const mainNavItems = [
  { label: 'Map', to: '/dashboard' },
  { label: 'Resources',isMegaMenu: true,
    columns :[
        { items: [ { title: 'Vehicles', to: '/vehicles' },{title: 'Trailers', to: 'trailers' }]},
        { items: [ {title: 'Drivers', to: '/drivers' }, ]},
        { items: [{title: 'Groups', to: 'groups' },{title:'Workshops', to: 'workshops' } ] }
      ] 
  },
  { label: 'Reports',
    isMegaMenu: true,
    columns: [
      { title: 'TRIP', items: [ { title: 'Trips', to: '#' }, { title: 'Trip Analysis', to: '#' } ] },
      { title: 'USAGE', items: [ { title: 'Fleet Utilisation', to: '#' }, { title: 'Vehicle Activity', to: '#' } ] },
      { title: 'DEALER', items: [ { title: 'Maintenance', to: '#' }, { title: 'Damage', to: '#' } ] },
    ]
  },
  {
    label: 'Tools',isMegaMenu: true,
    columns :[
        { items: [ { title: 'Geofences', to: '/geofences' },{title: 'Monitoring', to: '/monitoring' },{title: 'Services', to: '/services' }]},
        { items: [ {title: 'Settings', to: '/settings' },{title: 'Perform check', to: '/pdc' }, ]},
        { items: [{title: 'About', to: '/about' }] }
      ] 
  },
];

const handleLogout = () => {
    authStore.logout();
    settingsStore.clearSettings();
    router.push({ name: 'auth' });
};

const handleGroupChange = (groupId) => {
  if (groupId) {
    settingsStore.setSelectedGroup(groupId);
  }
};
onMounted(() => {
  if (!selectedGroup.value && authStore.customerId) {
    settingsStore.setSelectedGroup(authStore.customerId);
  }
});
</script>

<template>
  <nav class="flex h-16 items-center justify-between bg-white px-6">
    <div class="flex items-center gap-x-6">
      
      <router-link to="/" class="flex items-center space-x-2">
        <img src="/logo.svg" alt="Site Logo" class="h-8 w-8">
        <span class="text-xl font-bold">{{ settingsStore.siteName }}
        </span>
      </router-link>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem v-for="item in mainNavItems" :key="item.label">
            
            <router-link v-if="item.to" :to="item.to" :class="navigationMenuTriggerStyle()">
              {{ item.label }}
            </router-link>

            <template v-else>
              <NavigationMenuTrigger>{{ item.label }}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div v-if="item.isMegaMenu" class="grid w-[600px] grid-cols-3 gap-x-8 p-4">
                  <div v-for="col in item.columns" :key="col.title">
                    <h3 class="mb-2 font-bold text-gray-500">{{ col.title }}</h3>
                    <ul>
                      <li v-for="subItem in col.items" :key="subItem.title">
                        <router-link :to="subItem.to || '#'" class="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent">
                          {{ subItem.title }}
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </div>
                <ul v-else class="grid w-[200px] gap-3 p-4">
                  <li v-for="subItem in item.items" :key="subItem.title">
                      <router-link :to="subItem.to || '#'" class="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent">
                        {{ subItem.title }}
                      </router-link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </template>

          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
    <div v-if="authStore.isAuthenticated" class="flex items-center gap-4">
      <Select 
        v-if="settingsStore.customerGroups.length > 0" 
        :model-value="settingsStore.selectedGroup"
        @update:modelValue="handleGroupChange"
      >
        <SelectTrigger class="w-[220px]">
          <SelectValue placeholder="Select a group" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="group in settingsStore.customerGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" class="relative h-8 w-8 rounded-full">
        <Bell class="h-5 w-5" />
        <Badge class="absolute -top-1 -right-1 h-4 w-4 justify-center p-0">2</Badge>
      </Button>
      <Button variant="ghost" size="icon" class="relative h-8 w-8 rounded-full">
        <Mail class="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="font-semibold">
            {{ authStore.userName }}
            <User class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Mail class="mr-2 h-4 w-4" />
            <span>Messages</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <User class="mr-2 h-4 w-4" />
            <span>Profiel</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </nav>
</template>