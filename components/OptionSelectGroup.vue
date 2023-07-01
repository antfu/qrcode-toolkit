<script setup lang="ts">
defineProps<{
  options: string[] | number[]
  titles?: string[]
}>()

const value = defineModel<string | number>('modelValue', {
  type: [String, Number],
})
</script>

<template>
  <fieldset flex="~" border="~ base rounded" of-hidden text-sm>
    <label
      v-for="i, idx of options" :key="i"
      relative hover:bg-secondary px-2 py-0.5
      :class="[
        idx ? 'border-l border-base' : '',
        i === value ? 'bg-active' : '',
      ]"
    >
      <div
        :class="[
          i === value ? '' : 'op50',
          titles?.[idx] ? '' : 'capitalize',
        ]"
      >{{ titles?.[idx] || i }}</div>
      <input v-model="value" type="radio" :value="i" absolute inset-0 op-0.1>
    </label>
  </fieldset>
</template>
