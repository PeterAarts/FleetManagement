// FILE: main.ts (Corrected)

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Notiflix from 'notiflix';

// Your CSS imports
import 'notiflix/dist/notiflix-3.2.8.min.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import './assets/leaflet.awesome-rfmsmarkers.css'; 
import 'font-awesome/css/font-awesome.min.css'
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './style.css'


Notiflix.Confirm.init({
  titleColor: 'var(--color-primary-500)',
  okButtonBackground: 'var(--color-primary-500)',
  borderRadius: 'var(--radius)',
});

const app = createApp(App)
app.use(createPinia())
app.use(router)

app.mount('#app')