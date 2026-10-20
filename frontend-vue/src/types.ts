export interface Attachment {
  filename: string
  kind: string
  url: string
}
export interface TraceStep {
  type: string
  name?: string
  round?: number
  success?: boolean
  duration_ms?: number
}
export interface Source {
  filename?: string
  title?: string
  chunk_index?: number
  score?: number
  content?: string
}
export interface Message {
  id: string
  role: string
  content: string
  attachments?: string[]
  toolsUsed?: string[]
  answerOrigin?: string
  provider?: string
  model?: string
  knowledgeUsed?: boolean
  mode?: string
  warning?: string
  streaming?: boolean
  error?: boolean
  plan?: boolean
  question?: string
  interrupted?: boolean
  relatedUserMessageId?: string
  trace?: TraceStep[]
  sources?: Source[]
  images?: string[]
}
export interface Conversation {
  id: string
  title: string
  messages: Message[]
  files: Attachment[]
  pendingAttachmentNames: string[]
  knowledgeBaseIds: string[]
  executionMode: 'auto' | 'plan'
  chatModelId: string
  conversationInstructions: string
  responseStyle: string
  draft: string
  editingMessageId: string
  pinned: boolean
  archived: boolean
}
export interface Note { id: string; title: string; content?: string; excerpt?: string }
export interface Task {
  id: number
  title: string
  status: string
  due_date?: string
  priority?: string
  description?: string
}
export type RuntimeAction = 'selectConversation' | 'renameConversation' | 'pinConversation' |
  'archiveConversation' | 'deleteConversation' | 'openFile' | 'deleteFile' |
  'selectFile' | 'editNote' | 'deleteNote'
