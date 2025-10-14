<template>
  <div class="not-found-container">
    <div class="content">
      <!-- Icon/Illustration -->
      <div class="icon-wrapper">
        <svg class="road-icon" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Road -->
          <path d="M60 200 L80 0 L120 0 L140 200 Z" fill="#374151" opacity="0.3"/>
          <!-- Dashed lines -->
          <line x1="100" y1="10" x2="100" y2="40" stroke="#fff" stroke-width="3" stroke-dasharray="5,10"/>
          <line x1="100" y1="60" x2="100" y2="90" stroke="#fff" stroke-width="3" stroke-dasharray="5,10"/>
          <line x1="100" y1="110" x2="100" y2="140" stroke="#fff" stroke-width="3" stroke-dasharray="5,10"/>
          <line x1="100" y1="160" x2="100" y2="190" stroke="#fff" stroke-width="3" stroke-dasharray="5,10"/>
          <!-- Truck -->
          <g transform="translate(100, 100)">
            <rect x="-30" y="-15" width="60" height="25" fill="#3B82F6" rx="3"/>
            <rect x="-35" y="-10" width="20" height="15" fill="#60A5FA" rx="2"/>
            <circle cx="-20" cy="12" r="6" fill="#1F2937"/>
            <circle cx="20" cy="12" r="6" fill="#1F2937"/>
            <circle cx="-20" cy="12" r="3" fill="#6B7280"/>
            <circle cx="20" cy="12" r="3" fill="#6B7280"/>
          </g>
        </svg>
      </div>

      <!-- Error Code -->
      <h1 class="error-code">404</h1>
      
      <!-- Message -->
      <h2 class="error-title">Route Not Found</h2>
      <p class="error-message">
        Looks like this route has taken a wrong turn. The page you're looking for doesn't exist.
      </p>

      <!-- Actions -->
      <div class="actions">
        <button @click="goBack" class="btn btn-secondary">
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Go Back
        </button>
        <router-link to="/" class="btn btn-primary">
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Go Home
        </router-link>
      </div>

      <!-- Helpful Links -->
      <div class="helpful-links">
        <h3>Maybe you were looking for:</h3>
        <div class="links-grid">
          <router-link to="/dashboard" class="link-item">
            <svg class="link-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Dashboard
          </router-link>
          <router-link to="/vehicles" class="link-item">
            <svg class="link-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
            Vehicles
          </router-link>
          <router-link to="/drivers" class="link-item">
            <svg class="link-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Drivers
          </router-link>
          <router-link to="/reports" class="link-item">
            <svg class="link-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
            </svg>
            Reports
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
};
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.content {
  max-width: 600px;
  text-align: center;
  background: white;
  padding: 3rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.icon-wrapper {
  margin-bottom: 2rem;
}

.road-icon {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-code {
  font-size: 6rem;
  font-weight: 800;
  color: #1F2937;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1F2937;
  margin: 1rem 0;
}

.error-message {
  font-size: 1.125rem;
  color: #6B7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #F3F4F6;
  color: #1F2937;
}

.btn-secondary:hover {
  background: #E5E7EB;
  transform: translateY(-2px);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.helpful-links {
  border-top: 2px solid #F3F4F6;
  padding-top: 2rem;
}

.helpful-links h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 1rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: #F9FAFB;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.link-item:hover {
  background: #F3F4F6;
  transform: translateY(-2px);
  color: #667eea;
}

.link-icon {
  width: 1.5rem;
  height: 1.5rem;
}

@media (max-width: 640px) {
  .content {
    padding: 2rem 1.5rem;
  }

  .error-code {
    font-size: 4rem;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-message {
    font-size: 1rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .links-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>