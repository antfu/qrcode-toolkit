<script setup lang="ts">

</script>

<template>
  <div border="~ base rounded" flex="~ col gap-4" w-max p5 text-zinc3>
    This toolkit is made possible thanks to:

    <ul flex="~ col gap-3">
      <li ml4 list-disc>
        <a href="https://qrbtf.com" target="_blank">QRBTF.com</a> - The original idea of AI generated QR code.
      </li>
      <li ml4 list-disc>
        <a href="https://space.bilibili.com/339984/" target="_blank">@whmc76</a> - For the many great discussions and the idea of using non-square canvas.
      </li>
      <li ml4 list-disc>
        <div flex="~ gap-2">
          <VMenu>
            <div class="link">
              @代々木
            </div>
            <template #popper>
              <a href="https://www.xiaohongshu.com/user/profile/5be8fb806b58b745447aab0f" target="_blank" class="op100!">
                <img src="/qrcodes/credit-yoyogi.png" h-100 w-100 rounded>
              </a>
            </template>
          </VMenu>
          - For the idea of making position markers minimal.
        </div>
      </li>
      <li ml4 list-disc>
        All the researchers and model creators in this field.
      </li>
    </ul>

    <div my4 h-1px border-t border-base />

    <div text-center>
      And thanks to all the sponsors supporting my work:
    </div>

    <img mxa w-150 src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.png">
  </div>
</template>

<style scoped>
a, .link {
  --uno: op50 hover:op100 underline text-white cursor-pointer;
}
</style>
