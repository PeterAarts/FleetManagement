<!-- VehicleSettings.vue -->
<script setup>
const props = defineProps({
  vehicle: Object,
  mode: { 
    type: String, 
    default: 'display', // 'display', 'edit'
    validator: value => ['display', 'edit'].includes(value)
  },
  layout: {
    type: String,
    default: 'form', // 'form', 'card'
    validator: value => ['form', 'card'].includes(value)
  }
});

const emit = defineEmits(['update:vehicle']);

const updateField = (field, value) => {
  if (props.mode === 'edit') {
    emit('update:vehicle', { ...props.vehicle, [field]: value });
  }
};
</script>

<template>
  <!-- Form Layout (Resources View) -->
  <div v-if="layout === 'form'" class="bg-white rounded-lg p-6">
    <div class="grid grid-cols-2 gap-8">
      <!-- Vehicle Settings -->
      <div>
        <h4 class="font-bold text-sm text-gray-700 mb-4">vehicle settings</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">name</label>
            <input 
              v-if="mode === 'edit'"
              :value="vehicle?.name || ''"
              @input="updateField('name', $event.target.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm text-blue-600"
            />
            <span v-else class="text-sm font-medium text-blue-600">{{ vehicle?.name || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">license plate</label>
            <input 
              v-if="mode === 'edit'"
              :value="vehicle?.licensePlate || ''"
              @input="updateField('licensePlate', $event.target.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm text-blue-600"
            />
            <span v-else class="text-sm font-medium text-blue-600">{{ vehicle?.licensePlate || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">tank volume</label>
            <input 
              v-if="mode === 'edit'"
              :value="vehicle?.tankVolume || ''"
              @input="updateField('tankVolume', $event.target.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm text-blue-600"
            />
            <span v-else class="text-sm font-medium text-blue-600">{{ vehicle?.tankVolume || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">axles configuration</label>
            <input 
              v-if="mode === 'edit'"
              :value="vehicle?.axlesConfig || ''"
              @input="updateField('axlesConfig', $event.target.value)"
              class="w-full px-3 py-2 border border-gray-300 rounded text-sm text-blue-600"
            />
            <span v-else class="text-sm font-medium text-blue-600">{{ vehicle?.axlesConfig || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Details -->
      <div>
        <h4 class="font-bold text-sm text-gray-700 mb-4">details</h4>
        <div class="grid grid-cols-2 gap-x-4 gap-y-4 text-xs">
          <div>
            <label class="block text-gray-500 mb-1">vin</label>
            <span class="text-sm font-medium text-blue-600">{{ vehicle?.vin || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-gray-500 mb-1">brand / model</label>
            <span class="text-sm font-medium">{{ vehicle?.brand }} {{ vehicle?.model }}</span>
          </div>
          <div>
            <label class="block text-gray-500 mb-1">tachographType</label>
            <span class="text-sm font-medium">{{ vehicle?.tachographType || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-gray-500 mb-1">fuel type</label>
            <span class="text-sm font-medium">{{ vehicle?.fuelType || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-gray-500 mb-1">emission level</label>
            <span class="text-sm font-medium">{{ vehicle?.emissionLevel || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-gray-500 mb-1">productionDate</label>
            <span class="text-sm font-medium">{{ vehicle?.productionDate || 'N/A' }}</span>
          </div>
          <div>
            <label class="block text-gray-500 mb-1">gearboxType</label>
            <span class="text-sm font-medium">{{ vehicle?.gearboxType || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>