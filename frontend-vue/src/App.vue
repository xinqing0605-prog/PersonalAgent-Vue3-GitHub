<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import AuthScreen from './components/AuthScreen.vue'
import AppShell from './components/AppShell.vue'
import Overlays from './components/Overlays.vue'
import ImageViewer from './components/ImageViewer.vue'
import ImageActions from './components/ImageActions.vue'
import { createRuntime } from './runtime/createRuntime.ts'
let dispose: (() => void) | undefined
onMounted(() => { dispose = createRuntime() })
onBeforeUnmount(() => { dispose?.() })
</script>
<template><AuthScreen /><AppShell /><Overlays /><ImageViewer /><ImageActions /></template>

