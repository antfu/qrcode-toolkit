<script setup lang="ts">
import { isIOS, isSafari } from '~/logic/state'
</script>

<template>
  <div v-if="isSafari" border="~ orange/60 rounded" bg-orange-5:10 px3 py2 text-sm text-orange>
    Due to the limitation of Safari, the preprocessing might not work on your browser.

    <template v-if="isIOS">
      It seems you are on iOS. Unfortunately, all browsers on iOS are forced to use Safari as the engine. This feature might not work the best on your device. Try use a desktop browser or Android device instead.
    </template>
    <template v-else>
      We recommend you to use Chromium-based browsers such as Chrome, Edge, or Brave to get the best experience.
    </template>
  </div>
</template>
