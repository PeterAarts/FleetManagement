# Vue 3 Frontend Application
A modern, reactive, and scalable frontend application built with Vue 3. 
This project features a robust state management system using Pinia, seamless API integration with Axios, and a real-time auto-refresh mechanism to keep data up-to-date.
# Table of Contents
* FeaturesTech 
* Stack
* Installation
* Project Structure
* How It Works
* * State Management (Pinia Stores)
* * API Communication
* * Auto-Refresh Mechanism
* Scripts
* ContributingLicense
# Features
* Reactive UI: Built with the Vue 3 Composition API for flexible and maintainable components.
* Centralized State Management: Uses Pinia for a type-safe, intuitive, and devtools-friendly store.
* Modular API Layer: Cleanly separated and reusable API service for handling HTTP requests.
* Real-time Data Updates: An auto-refresh feature that polls the API to fetch the latest data periodically, ensuring the UI is always in sync.
* Modern Tooling: Vite for lightning-fast development and builds.
* Code Quality: Pre-configured with ESLint and Prettier for consistent code style.
# Tech Stack
* Framework: Vue 3
* State Management: Pinia
* HTTP Client: Axios
* Build Tool: Vite
* Router: Vue Router
* Linting/Formatting: ESLint & Prettier
# Installation
Follow these steps to get the project up and running on your local machine.
## 1. Clone the repository:
````
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
````

## 2. Install dependencies:
We recommend using <kbd> npm</kbd> , but you can also use <kbd>yarn</kbd> or <kbd>pnpm</kbd>.
````
npm install
````
## 3. Configure Environment Variables:
Create a <kbd>.env.local</kbd> file in the root of the project by copying the example file:
````
cp .env.example .env.local
````
Now, open <kbd>.env.local</kbd> and add the base URL for your backend API:
````
VITE_API_BASE_URL=http://localhost:8000/api
````
## 4. Run the development server:
````
npm run dev
````
The application should now be running on <kbd>http://localhost:5173</kbd>
**Project Structure**
Here's an overview of the most important directories:
````
/src
├── /assets        # Static assets (images, styles)
├── /components    # Reusable Vue components
├── /composables   # Reusable Vue functionality
├── /router        # Vue Router configuration
├── /stores        # Pinia store modules
├── /tools         # API services (Axios instances and request logic)
├── /views         # Page components (routed components)
├── App.vue        # 
└── main.js        # Application entry point
````
# How It Works
This section explains the core architecture of the application.

**State Management (Pinia Stores)**

We use Pinia to manage the application's global state. Each store is responsible for a specific domain of data (e.g., users, products).
Example Store (<kbd>/src/stores/dataStore.js</kbd>):
A typical store contains:
* <kbd>state</kbd> : The reactive data for the store.
* <kbd>getters</kbd> : Computed properties derived from the state.
* <kbd>actions</kbd> : Methods to perform asynchronous operations (like API calls) and mutate the state.

````
// src/stores/dataStore.js
import { defineStore } from 'pinia';
import apiService from '@/api/apiService';

export const useDataStore = defineStore('data', {
  state: () => ({
    items: [],
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchData() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await apiService.getData();
        this.items = response.data;
      } catch (err) {
        this.error = 'Failed to fetch data.';
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
});
````
Components can then import and use this store to access state or trigger actions:
````
<!-- YourComponent.vue -->
<script setup>
import { onMounted } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { storeToRefs } from 'pinia';

const dataStore = useDataStore();
const { items, isLoading, error } = storeToRefs(dataStore); // To maintain reactivity

onMounted(() => {
  dataStore.fetchData();
});
</script>
````
**API Communication**

All communication with the backend is handled through a dedicated API service layer built on top of Axios.

**API Service** (<kbd>/src/api/apiService.js</kbd>):

This file centralizes the Axios instance, including base URL, headers, and error handling. It exports methods for each API endpoint.
````
// src/api/apiService.js
import axios from 'axios';

// Create an Axios instance with a base URL from environment variables
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export API methods
export default {
  getData() {
    return apiClient.get('/items');
  },
  // Add other methods like create, update, delete
  // createItem(payload) {
  //   return apiClient.post('/items', payload);
  // }
};
````
This approach keeps our components clean, as they don't need to know the specific API endpoints or how Axios works. They simply call actions in the Pinia store.

**Auto-Refresh Mechanism**

To ensure the data displayed is always current, the application includes an auto-refresh mechanism that periodically re-fetches data from the API.
This is implemented within the main component or view that needs live data (e.g., <kbd>App.vue</kbd> or a dashboard view).

**Implementation** (<kbd>/src/views/DashboardView.vue</kbd>):

We use <kbd>setInterval</kbd> to call the <kbd>fetchData</kbd> action from our Pinia store at a regular interval. The interval is cleared when the component is unmounted to prevent memory leaks.
````
<!-- /src/views/DashboardView.vue -->
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();
let refreshInterval;

onMounted(() => {
  // 1. Initial fetch when the component mounts
  dataStore.fetchData();

  // 2. Set up an interval to refresh data every 30 seconds
  const refreshRate = 30000; // 30 seconds in milliseconds
  refreshInterval = setInterval(() => {
    console.log('Refreshing data...');
    dataStore.fetchData();
  }, refreshRate);
});

onUnmounted(() => {
  // 3. Clear the interval when the component is destroyed
  clearInterval(refreshInterval);
});
</script>
````
This simple yet effective polling mechanism keeps the frontend synchronized with the backend. For more complex real-time needs, this could be replaced with WebSockets.
**Scripts**
* <kbd>npm run dev</kbd> : Starts the development server with hot-reloading.
* <kbd>npm run build</kbd> : Compiles and minifies the application for production.
* <kbd>npm run preview<kbd> : Serves the production build locally for testing.
* <kbd>npm run lint</kbd> : Lints the code using ESLint.
**Contributing**
Contributions are welcome! Please feel free to open an issue or submit a pull request.
1. Fork the repository.
2. Create a new branch (git checkout -b feature/your-feature).
3. Commit your changes (git commit -m 'Add some feature').
4. Push to the branch (git push origin feature/your-feature).
5. Open a Pull Request.

# License
This project is licensed under the MIT License.
