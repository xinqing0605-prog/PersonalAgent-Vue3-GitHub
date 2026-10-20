import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Attachment, Conversation, Note, RuntimeAction, Task } from '../types'

/** Runtime publishes immutable snapshots; Vue alone owns these rendered regions. */
export const useWorkspaceStore = defineStore('workspace', () => {
  const current = shallowRef<Conversation | null>(null)
  const conversations = shallowRef<Conversation[]>([])
  const attachments = shallowRef<Attachment[]>([])
  const selectedFiles = shallowRef<string[]>([])
  const notes = shallowRef<Note[]>([])
  const tasks = shallowRef<Task[]>([])
  const notesStatus = ref('')
  const notesError = ref(false)
  const tasksStatus = ref('')
  const tasksError = ref(false)
  let handler: ((action: RuntimeAction, id: string, selected?: boolean) => void) | undefined

  function connect(callback: typeof handler) { handler = callback }
  function dispatch(action: RuntimeAction, id: string, selected?: boolean) { handler?.(action, id, selected) }
  function reset() {
    current.value = null
    conversations.value = []
    attachments.value = []
    selectedFiles.value = []
    notes.value = []
    tasks.value = []
    notesStatus.value = ''
    tasksStatus.value = ''
  }
  return { current, conversations, attachments, selectedFiles, notes, tasks, notesStatus, notesError,
    tasksStatus, tasksError, connect, dispatch, reset }
})
