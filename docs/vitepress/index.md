---
layout: home
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()

onMounted(() => {
  const lang = navigator.language
  if (lang.startsWith('zh')) {
    router.go('/webrtc/zh/')
  } else {
    router.go('/webrtc/en/')
  }
})
</script>
