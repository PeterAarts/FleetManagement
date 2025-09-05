import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Your CSS imports
import './style.css'
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import './assets/css/leaflet.awesome-rfmsmarkers.css'; 
import 'font-awesome/css/font-awesome.min.css'
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'font-awesome/css/font-awesome.min.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)


app.mount('#app')