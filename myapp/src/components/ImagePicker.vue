<template>
  <div>
   <!-- <button @click="openPicker" type="button" class="btn btn-outline-secondary hidden">
      {{ buttonLabel }}
    </button>-->

    <div class="offcanvas offcanvas-end" tabindex="-1" :id="props.modalId" :aria-labelledby="`${props.modalId}Label`" ref="pickerRef" style="width: 30vw;">
      <div class="offcanvas-header border-bottom">
        <h5 class="offcanvas-title" :id="`${props.modalId}Label`">Select an Image</h5>
        <button type="button" class="btn-close" @click="closePicker" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <div class="d-flex justify-content-end mb-3">
          <input type="file" ref="uploadInputRef" @change="handleImageUpload" accept="image/*" class="d-none">
          <button @click="triggerUpload" class="btn btn-primary" :disabled="uploading">
            <span v-if="uploading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span v-else>Upload New Image</span>
          </button>
        </div>
        
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div v-else-if="images.length === 0" class="text-center text-muted py-5">
          No images have been uploaded yet.
        </div>
        <div v-else class="image-grid g-3">
          <div v-for="image in images" :key="image.path" class="ol">
            <div class="image-thumbnail" @click="selectImage(image.path)">
              <img :src="getImageUrl(image.path)" alt="Uploaded image" class="img-fluid rounded">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose } from 'vue' 
import apiClient from '@/utils/apiClient';
import eventBus from '@/utils/eventBus';

const onSelectCallback = ref(null);
const props = defineProps({
  buttonLabel: {
    type: String,
    default: 'Select Image'
  },
  modalId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['imageSelected'])

const images = ref([])
const loading = ref(true)
const uploading = ref(false)
const pickerRef = ref(null)
const pickerInstance = ref(null)
const uploadInputRef = ref(null)

const getImageUrl = (filePath) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${filePath}`;
}

const fetchImages = async () => {
  loading.value = true;
  try {
    images.value = await apiClient('/images');
  } catch (error) {
    console.error('Error fetching images:', error);
  } finally {
    loading.value = false;
  }
}
const openPickerWithCallback = (callback) => {
  if (typeof callback === 'function') {
    onSelectCallback.value = callback;
  }
  fetchImages();
  if (pickerInstance.value) {
    pickerInstance.value.show();
  }
}

const openPicker = () => {
  fetchImages();
  if (pickerInstance.value) {
    pickerInstance.value.show();
  }
}

const closePicker = () => {
  if (pickerInstance.value) {
    pickerInstance.value.hide();
  }
}

const selectImage = (imagePath) => {
  emit('imageSelected', imagePath);
  // If a callback exists, execute it
  if (onSelectCallback.value) {
    onSelectCallback.value(imagePath);
  }
  closePicker();
}

const triggerUpload = () => {
  uploadInputRef.value.click();
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const shouldResize = confirm('Resize image to a max of 700px? (Recommended)');
  const formData = new FormData();
  formData.append('productImage', file);
  uploading.value = true;
  try {
    const endpoint = `/upload?resize=${shouldResize}`;
    const data = await apiClient(endpoint, { method: 'POST', body: formData });
    
    // Use the callback here as well
    emit('imageSelected', data.filePath);
    if (onSelectCallback.value) {
        onSelectCallback.value(data.filePath);
    }

    closePicker();
  } catch (error) {
    // Notifier is handled by apiClient
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
}

defineExpose({
  openPicker
});

onMounted(() => {
  if (pickerRef.value) {
    pickerInstance.value = new window.bootstrap.Offcanvas(pickerRef.value);
  }
  // Add the event listener when the component is mounted
  eventBus.on('open-image-picker', openPickerWithCallback);
});

onUnmounted(() => {
  if (pickerInstance.value) {
    pickerInstance.value.dispose();
  }
  // Remove the event listener to prevent memory leaks
  eventBus.off('open-image-picker', openPickerWithCallback);
});
</script>

<!-- ADDED: Non-scoped style to ensure the offcanvas is always on top -->
<style>
.offcanvas-backdrop {
  z-index: 1056 !important; /* Higher than a modal's z-index (1055) */
}
#globalImagePicker {
  z-index: 1057 !important; /* Higher than the backdrop */
}
</style>

<style scoped>
.image-thumbnail {
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-in-out;
  width: 100px;
}
.image-thumbnail:hover {
  border-color: #0d6efd; /* Bootstrap primary color */
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-start;
}

.image-grid-item {
  flex: 1 0 120px; /* Grow, shrink, min width */
  max-width: 180px; /* Optional: limit max width */
  min-width: 120px;
  display: flex;
}

.img-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--bs-border-radius);
  cursor: pointer;
  width: 100%;
  aspect-ratio: 1 / 1; /* Maintain square shape */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.img-card .img-fluid {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Maintain aspect ratio, show full image */
  aspect-ratio: 1 / 1;
  display: block;
}
</style>
