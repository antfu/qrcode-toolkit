export const view = ref<'generator' | 'compare' | 'credit' | 'scan'>(location.hash.slice(1) as any || 'generator')

if (!['generator', 'compare', 'credit', 'scan'].includes(view.value))
  view.value = 'generator'

watchEffect(() => {
  location.hash = view.value
})
