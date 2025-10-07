// composables/useResourceDetail.js
import { ref } from 'vue';
import apiClient from '@/tools/apiClient';

/**
 * Generic composable for managing resource detail/edit modal
 * Calls resource-specific endpoints that return { data: {...}, formBuild: [...] }
 * 
 * @param {string} resourceType - Resource type: 'vehicles', 'drivers', 'trailers'
 * @param {Object} modalConfig - Modal configuration (formTitle, formTabs)
 * @returns {Object} Modal state and methods
 */
export function useResourceDetail(resourceType, modalConfig = {}) {
  const showModal = ref(false);
  const currentResource = ref(null);
  const formBuild = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  /**
   * Fetch resource details with formBuild
   * Calls: GET /api/{resourceType}/{id}?includeForm=true
   * Returns: { data: {...}, formBuild: [...] }
   */
  const fetchDetails = async (id) => {
    isLoading.value = true;
    error.value = null;
    currentResource.value = null;
    formBuild.value = [];

    try {
      // Call resource-specific endpoint with includeForm flag
      const response = await apiClient.get(`/${resourceType}/${id}`, {
        params: { includeForm: true }
      });

      if (response.data) {
        // Check if response has formBuild (edit mode) or is direct data (view mode)
        if (response.data.formBuild) {
          // Response format: { data: {...}, formBuild: [...] }
          currentResource.value = response.data.data;
          formBuild.value = response.data.formBuild;
        } else {
          // Legacy format: direct data object
          currentResource.value = response.data;
          formBuild.value = [];
        }
        
        showModal.value = true;

        // Call tab initialization functions after modal opens
        if (modalConfig.formTabs && Array.isArray(modalConfig.formTabs)) {
          setTimeout(() => {
            modalConfig.formTabs.forEach(tab => {
              if (tab.onClick && typeof window[tab.onClick] === 'function') {
                try {
                  window[tab.onClick](currentResource.value.id, tab.id);
                } catch (e) {
                  console.error(`Error calling ${tab.onClick}:`, e);
                }
              }
            });
          }, 100);
        }
      }
    } catch (err) {
      error.value = err.response?.data?.message || `Failed to fetch ${resourceType} details`;
      console.error(`Error fetching ${resourceType} details:`, err);
      
      if (window.Notiflix) {
        window.Notiflix.Notify.failure(error.value);
      }
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Save resource changes
   * PUT /api/{resourceType}/{id}
   */
  const saveResource = async (updatedData) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiClient.put(
        `/${resourceType}/${updatedData.id}`, 
        updatedData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data) {
        if (window.Notiflix) {
          const displayName = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
          window.Notiflix.Notify.success(`${displayName} updated successfully`);
        }

        currentResource.value = { ...currentResource.value, ...updatedData };
        
        // Emit custom event for parent components to refresh
        window.dispatchEvent(new CustomEvent(`${resourceType}-updated`, {
          detail: { id: updatedData.id, data: updatedData }
        }));

        closeModal();
        return response.data;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to save changes';
      console.error(`Error saving ${resourceType}:`, err);
      
      if (window.Notiflix) {
        window.Notiflix.Notify.failure(error.value);
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete resource
   * DELETE /api/{resourceType}/{id}
   */
  const deleteResource = async (id) => {
    try {
      await apiClient.delete(`/${resourceType}/${id}`);

      if (window.Notiflix) {
        const displayName = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
        window.Notiflix.Notify.success(`${displayName} deleted successfully`);
      }

      window.dispatchEvent(new CustomEvent(`${resourceType}-deleted`, {
        detail: { id }
      }));

      return true;
    } catch (err) {
      console.error(`Error deleting ${resourceType}:`, err);
      
      if (window.Notiflix) {
        window.Notiflix.Notify.failure('Failed to delete');
      }
      
      throw err;
    }
  };

  /**
   * Close modal and reset state
   */
  const closeModal = () => {
    showModal.value = false;
    setTimeout(() => {
      currentResource.value = null;
      formBuild.value = [];
      error.value = null;
    }, 300);
  };

  /**
   * Open modal from URL parameter (deep linking)
   */
  const openFromUrl = (id) => {
    if (id) {
      fetchDetails(id);
    }
  };

  return {
    // State
    showModal,
    currentResource,
    formBuild,
    isLoading,
    error,
    
    // Methods
    fetchDetails,
    saveResource,
    deleteResource,
    closeModal,
    openFromUrl
  };
}