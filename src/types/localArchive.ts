import type { ProjectFile } from './serialization'

export interface LocalUser {
  id: string
  name: string
  avatar?: string
  createdAt: number
  updatedAt: number
  lastOpenedSaveId?: string
}

export interface SaveSlot {
  id: string
  userId: string
  name: string
  createdAt: number
  updatedAt: number
  nodeCount: number
  edgeCount: number
  projectVersion: string
}

export interface LocalSave {
  meta: SaveSlot
  project: ProjectFile
}

export interface LocalAppState {
  id: 'singleton'
  version: number
  currentUserId: string | null
  currentSaveId: string | null
}
