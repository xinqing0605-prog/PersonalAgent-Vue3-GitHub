<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useThemeStore, themeNames, type ThemeId } from '../../stores/theme'
const theme = useThemeStore()
const imageInput = ref<HTMLInputElement>()
const nameInput = ref<HTMLInputElement>()
const builtinIds: ThemeId[] = ['mint', 'ocean', 'violet', 'apricot']
const custom = computed(() => theme.draft.theme_id === 'custom' && !!theme.draft.custom_background)
const previewStyle = computed(() => custom.value ? { backgroundImage: `url("${theme.draft.custom_background.replace(/"/g, '%22')}")` } : {})
function changeTab(tab: 'settings' | 'favorites') { theme.tab = tab; theme.favoriteChoice = null }
async function arrowTab(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
  event.preventDefault(); changeTab(theme.tab === 'settings' ? 'favorites' : 'settings')
  await nextTick(); document.getElementById(theme.tab === 'settings' ? 'themeSettingsTab' : 'themeFavoritesTab')?.focus()
}
function selectImage(event: Event) { const input = event.target as HTMLInputElement; void theme.selectImage(input.files?.[0]); input.value = '' }
watch(() => theme.favoriteChoice, async choice => { if (choice) { await nextTick(); nameInput.value?.focus(); nameInput.value?.select() } })
watch(() => theme.visible, async visible => { if (visible) { await nextTick(); document.getElementById('closeTheme')?.focus() } })
</script>
<template>
  <div class="modal-backdrop compact-modal" id="themeModal" :hidden="!theme.visible">
    <form class="theme-dialog" id="themeForm" aria-label="外观与主题" @submit.prevent="theme.save()">
      <div class="dialog-heading"><div><h2>外观与主题</h2><p class="dialog-subtitle">只保存到当前账户，不会影响这台电脑上的其他账户。</p></div><button class="modal-close" id="closeTheme" type="button" aria-label="关闭" @click="theme.close()">×</button></div>
      <div class="theme-dialog-body">
        <div class="theme-tabs" role="tablist" aria-label="主题页面" @keydown="arrowTab">
          <button class="theme-tab" id="themeSettingsTab" type="button" role="tab" :aria-selected="theme.tab === 'settings'" aria-controls="themeSettingsPanel" :tabindex="theme.tab === 'settings' ? 0 : -1" @click="changeTab('settings')">主题设置</button>
          <button class="theme-tab" id="themeFavoritesTab" type="button" role="tab" :aria-selected="theme.tab === 'favorites'" aria-controls="themeFavoritesPanel" :tabindex="theme.tab === 'favorites' ? 0 : -1" @click="changeTab('favorites')">收藏</button>
        </div>
        <div class="theme-tab-panels">
          <section class="theme-tab-panel theme-settings-panel" id="themeSettingsPanel" role="tabpanel" aria-labelledby="themeSettingsTab" :hidden="theme.tab !== 'settings'">
            <div class="theme-section-heading"><strong>内置主题</strong><small>点击即可预览，保存后生效</small></div>
            <div class="theme-grid" id="themeOptions">
              <div v-for="id in builtinIds" :key="id" class="theme-option-card">
                <button class="theme-option" :class="{ selected: theme.draft.theme_id === id }" :data-theme-choice="id" type="button" :aria-pressed="theme.draft.theme_id === id" @click="theme.choose(id)"><span class="theme-swatch" :class="`theme-swatch-${id}`"></span><span class="theme-option-name">{{ themeNames[id] }}</span></button>
                <button class="theme-heart theme-card-heart" :class="{ 'is-favorite': !!theme.favoriteFor(id) }" :data-theme-favorite-toggle="id" type="button" :aria-pressed="!!theme.favoriteFor(id)" :aria-label="`${theme.favoriteFor(id) ? '取消收藏' : '收藏'}${themeNames[id]}主题`" @click="theme.toggleFavorite(id)">{{ theme.favoriteFor(id) ? '♥' : '♡' }}</button>
              </div>
            </div>
            <div class="custom-theme-card selected">
              <div class="custom-theme-preview-wrap">
                <div class="custom-theme-preview" :class="custom ? 'has-image' : `theme-swatch-${theme.draft.theme_id}`" :style="previewStyle" id="customThemePreview" role="img" :aria-label="`当前主题预览：${themeNames[theme.draft.theme_id]}`">{{ custom ? '' : themeNames[theme.draft.theme_id] }}</div>
                <button class="theme-heart theme-card-heart" :class="{ 'is-favorite': !!theme.favoriteFor(theme.draft.theme_id) }" :data-theme-favorite-toggle="theme.draft.theme_id" type="button" :aria-pressed="!!theme.favoriteFor(theme.draft.theme_id)" aria-label="收藏当前主题" @click="theme.toggleFavorite(theme.draft.theme_id)">{{ theme.favoriteFor(theme.draft.theme_id) ? '♥' : '♡' }}</button>
              </div>
              <div class="custom-theme-controls">
                <div><strong id="currentThemeTitle">当前主题 · {{ themeNames[theme.draft.theme_id] }}</strong><p class="auth-field-hint">可选择内置主题或自定义图片；图片支持 PNG、JPG、WebP，不超过 5 MB。</p></div>
                <div class="custom-theme-file" id="customThemeFileName">{{ custom ? theme.draft.custom_background_name : '内置渐变背景' }}</div>
                <div class="custom-theme-actions"><button id="chooseThemeImage" type="button" @click="imageInput?.click()">选择图片</button><button id="removeThemeImage" type="button" :hidden="!custom" @click="theme.removeImage()">移除图片</button></div>
                <label class="theme-overlay-control">界面不透明度<input id="themeOverlay" type="range" min="0" max="100" step="1" :value="Math.round(theme.draft.overlay * 100)" @input="theme.opacity(Number(($event.target as HTMLInputElement).value))" /><span class="theme-overlay-value" id="themeOverlayValue">{{ Math.round(theme.draft.overlay * 100) }}%</span></label>
                <p class="auth-field-hint">适用于内置主题和图片主题。0% 完全透明，100% 完全不透明。</p>
                <input ref="imageInput" id="themeImageInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="selectImage" />
              </div>
            </div>
          </section>
          <section class="theme-tab-panel theme-favorites-panel" id="themeFavoritesPanel" role="tabpanel" aria-labelledby="themeFavoritesTab" :hidden="theme.tab !== 'favorites'">
            <div class="theme-section-heading"><strong>收藏的主题</strong><small>点击缩略图立即切换；点击爱心取消收藏</small></div>
            <div class="theme-favorite-list" id="themeFavoriteList">
              <article v-for="favorite in theme.favorites" :key="favorite.id" class="theme-favorite-card" :class="{ current: theme.matches(favorite) }">
                <span v-if="theme.matches(favorite)" class="theme-current-label">当前选择</span>
                <button class="theme-favorite-thumbnail" :data-theme-favorite-activate="favorite.id" type="button" :aria-label="`切换到${favorite.name}主题`" @click="theme.activate(favorite.id)">
                  <img v-if="favorite.theme_id === 'custom'" :src="`/api/theme/favorites/${encodeURIComponent(favorite.id)}/preview`" alt="" loading="lazy" draggable="false" />
                  <span v-else class="theme-favorite-image" :class="`theme-swatch-${favorite.theme_id}`"></span>
                  <span class="theme-favorite-caption"><strong>{{ favorite.name }}</strong><small>{{ themeNames[favorite.theme_id] }} · 界面不透明度 {{ Math.round(favorite.overlay * 100) }}%</small></span>
                </button>
                <button class="theme-heart theme-favorite-remove is-favorite" :data-theme-favorite-delete="favorite.id" type="button" aria-pressed="true" :aria-label="`取消收藏${favorite.name}主题`" title="取消收藏" @click="theme.removeFavorite(favorite.id)">♥</button>
              </article>
              <div v-if="!theme.favorites.length" class="theme-favorite-empty">还没有收藏主题。请在“主题设置”中点击爱心收藏。</div>
            </div>
          </section>
        </div>
        <div class="theme-message" :class="{ success: !theme.error && !!theme.message }" id="themeMessage" role="alert">{{ theme.message }}</div>
      </div>
      <div class="theme-favorite-editor-backdrop" id="themeFavoriteEditor" :hidden="!theme.favoriteChoice" @keydown.esc.stop.prevent="theme.favoriteChoice = null">
        <section class="theme-favorite-editor" role="dialog" aria-modal="true" aria-labelledby="themeFavoriteEditorTitle">
          <h3 id="themeFavoriteEditorTitle">收藏主题</h3><p>名称可以修改，也可以直接使用下面的默认名称。</p>
          <label>收藏名称（可选）<input ref="nameInput" v-model="theme.favoriteName" id="themeFavoriteName" type="text" maxlength="40" placeholder="不填写也可以收藏" autocomplete="off" @keydown.enter.prevent="theme.confirmFavorite()" /></label>
          <div class="theme-favorite-editor-message" id="themeFavoriteEditorMessage" role="alert">{{ theme.favoriteError }}</div>
          <footer><button class="secondary-button" id="cancelThemeFavorite" type="button" @click="theme.favoriteChoice = null">取消</button><button class="primary-button" id="confirmThemeFavorite" type="button" :disabled="theme.busy" @click="theme.confirmFavorite()">收藏</button></footer>
        </section>
      </div>
      <footer><button class="secondary-button" id="cancelTheme" type="button" @click="theme.close()">取消</button><button class="primary-button" id="saveTheme" type="submit" :disabled="theme.busy">保存主题</button></footer>
    </form>
  </div>
</template>
