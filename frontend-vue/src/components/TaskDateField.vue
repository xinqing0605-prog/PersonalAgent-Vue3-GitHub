<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const selected = ref('')
const expanded = ref(false)
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const displayDate = computed(() => selected.value ? selected.value.replace(/-/g, ' / ') : '\u00a0')
const firstWeekday = computed(() => (new Date(year.value, month.value, 1).getDay() + 6) % 7)
const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate())

function todayValue() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function dateValue(day: number) {
  return `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function syncFromInput() {
  selected.value = (input.value?.value || '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(selected.value)) {
    year.value = Number(selected.value.slice(0, 4))
    month.value = Number(selected.value.slice(5, 7)) - 1
  }
}

function setDate(value: string) {
  selected.value = value
  if (input.value) {
    input.value.value = value
    input.value.dispatchEvent(new Event('change', { bubbles: true }))
  }
  expanded.value = false
}

function shiftMonth(amount: number) {
  const next = new Date(year.value, month.value + amount, 1)
  year.value = next.getFullYear()
  month.value = next.getMonth()
}

function toggleCalendar() {
  if (!expanded.value) syncFromInput()
  expanded.value = !expanded.value
}

function closeOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) expanded.value = false
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') expanded.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', closeOutside)
  document.addEventListener('keydown', closeOnEscape)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', closeOutside)
  document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <div ref="root" class="task-date-field">
    <input id="taskDue" ref="input" type="hidden" value="" @change="syncFromInput" />
    <div class="task-date-control">
      <button type="button" class="task-date-trigger" aria-label="选择截止日期" :aria-expanded="expanded"
        aria-controls="taskDue-calendar" aria-haspopup="dialog" @click="toggleCalendar">
        <span :class="{ empty: !selected }">{{ displayDate }}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
      </button>
      <button v-if="selected" type="button" class="task-date-clear" aria-label="清除截止日期" @click="setDate('')">×</button>
    </div>
    <div v-if="expanded" id="taskDue-calendar" class="task-calendar" role="dialog" aria-label="选择截止日期">
      <div class="task-calendar-head">
        <button type="button" aria-label="上一年" @click="shiftMonth(-12)">«</button>
        <button type="button" aria-label="上个月" @click="shiftMonth(-1)">‹</button>
        <strong>{{ year }} 年 {{ month + 1 }} 月</strong>
        <button type="button" aria-label="下个月" @click="shiftMonth(1)">›</button>
        <button type="button" aria-label="下一年" @click="shiftMonth(12)">»</button>
      </div>
      <div class="task-calendar-grid">
        <span v-for="weekday in weekDays" :key="weekday" class="task-calendar-weekday">{{ weekday }}</span>
        <span v-for="(_, index) in firstWeekday" :key="`blank-${index}`" aria-hidden="true"></span>
        <button v-for="day in daysInMonth" :key="day" type="button" :aria-label="dateValue(day)"
          :class="{ selected: selected === dateValue(day), today: dateValue(day) === todayValue() }"
          @click="setDate(dateValue(day))">{{ day }}</button>
      </div>
      <div class="task-calendar-actions"><button type="button" @click="setDate(todayValue())">今天</button><button type="button" @click="setDate('')">清除</button></div>
    </div>
  </div>
</template>
