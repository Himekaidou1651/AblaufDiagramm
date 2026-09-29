import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  deleteLocalUser,
  deleteSave,
  getSave,
  loadAppState,
  loadLocalUsers,
  loadSaveMetas,
  putAppState,
  putLocalUser,
  putSave,
} from '@/services/localArchive/localArchiveDb'
import type {
  LocalAppState,
  LocalSave,
  LocalUser,
  SaveSlot,
} from '@/types/localArchive'
import type { ProjectFile } from '@/types/serialization'
import {
  CANVAS_INITIAL_HEIGHT,
  CANVAS_INITIAL_WIDTH,
} from '@/constants/canvas'
import {
  PROJECT_FILE_VERSION,
  SAVE_NAME_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from '@/constants/storage'
import {
  findSaveById,
  resolveCurrentSaveId,
  resolveCurrentUserId,
  validateSaveName,
  validateUserName,
} from '@/services/localArchive/archiveSelection'

const APP_STATE_VERSION = 1

export interface SaveProjectResult {
  savedLocally: boolean
  synced: boolean
  syncError?: string
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * @brief 创建空白项目正文，与导出格式保持完全一致。
 * @returns 统一格式的空项目
 */
export function createBlankProjectFile(): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    viewport: { x: 0, y: 0, zoom: 1 },
    canvas: {
      x: 0,
      y: 0,
      width: CANVAS_INITIAL_WIDTH,
      height: CANVAS_INITIAL_HEIGHT,
    },
    nodes: [],
    edges: [],
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function cloneForDesktop<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const useLocalArchiveStore = defineStore('localArchive', () => {
  const initialized = ref(false)
  const initializing = ref(false)
  const initializationError = ref('')
  const users = ref<LocalUser[]>([])
  const saveMetas = ref<SaveSlot[]>([])
  const currentUserId = ref<string | null>(null)
  const currentSaveId = ref<string | null>(null)
  const syncError = ref('')

  let initPromise: Promise<void> | null = null

  const currentUser = computed(
    () => users.value.find(user => user.id === currentUserId.value) ?? null,
  )
  const currentSaveMeta = computed(
    () => saveMetas.value.find(save => save.id === currentSaveId.value) ?? null,
  )
  const lastProjectMeta = computed<SaveSlot | null>(() => {
    const saveId = currentUser.value?.lastOpenedSaveId
    return findSaveById(saveMetas.value, saveId ?? null)
  })
  const hasUsers = computed(() => users.value.length > 0)
  const hasSaves = computed(() => saveMetas.value.length > 0)
  const ready = computed(() => initialized.value && !initializing.value)

  async function persistAppState() {
    const state: LocalAppState = {
      id: 'singleton',
      version: APP_STATE_VERSION,
      currentUserId: currentUserId.value,
      currentSaveId: currentSaveId.value,
    }
    await putAppState(state)
  }

  async function loadCurrentUserSaves() {
    saveMetas.value = currentUserId.value
      ? await loadSaveMetas(currentUserId.value)
      : []
  }

  async function syncDesktopArchive(user: LocalUser, save?: LocalSave): Promise<string | null> {
    const desktopArchive = typeof window !== 'undefined' ? window.desktopAPI?.archive : undefined
    if (!desktopArchive) return null

    try {
      await desktopArchive.save({
        user: cloneForDesktop(user),
        users: cloneForDesktop(users.value),
        save: save ? cloneForDesktop(save) : undefined,
      })
      return null
    } catch (error) {
      return getErrorMessage(error)
    }
  }

  async function importDesktopArchive(): Promise<void> {
    const desktopArchive = typeof window !== 'undefined' ? window.desktopAPI?.archive : undefined
    if (!desktopArchive) return

    try {
      const snapshot = await desktopArchive.load()
      const localUsers = await loadLocalUsers()
      const localUserById = new Map(localUsers.map(user => [user.id, user]))

      for (const diskUser of snapshot.users) {
        const localUser = localUserById.get(diskUser.id)
        if (!localUser || diskUser.updatedAt > localUser.updatedAt) {
          await putLocalUser(diskUser)
        }
      }

      const warnings: string[] = snapshot.warnings.slice()
      for (const diskSave of snapshot.saves) {
        const localSave = await getSave(diskSave.meta.id)
        if (!localSave || diskSave.meta.updatedAt > localSave.meta.updatedAt) {
          await putSave(diskSave)
        }
      }

      users.value = await loadLocalUsers()
      if (warnings.length > 0) {
        syncError.value = warnings.join('; ')
      }
    } catch (error) {
      syncError.value = getErrorMessage(error)
    }
  }

  async function init(): Promise<void> {
    if (initialized.value) return
    if (initPromise) return initPromise

    initializing.value = true
    initializationError.value = ''
    initPromise = (async () => {
      try {
        users.value = await loadLocalUsers()
        await importDesktopArchive()
        const state = await loadAppState()
        const storedUserId = state?.currentUserId ?? null
        currentUserId.value = resolveCurrentUserId(users.value, storedUserId)

        await loadCurrentUserSaves()

        const selectedUser = currentUserId.value
          ? users.value.find(user => user.id === currentUserId.value)
          : null
        currentSaveId.value = resolveCurrentSaveId(
          saveMetas.value,
          state?.currentSaveId ?? null,
          selectedUser?.lastOpenedSaveId,
        )

        if (selectedUser && selectedUser.lastOpenedSaveId !== currentSaveId.value) {
          selectedUser.lastOpenedSaveId = currentSaveId.value ?? undefined
          selectedUser.updatedAt = Date.now()
          await putLocalUser(selectedUser)
        }

        await persistAppState()
        initialized.value = true
      } catch (error) {
        initializationError.value = getErrorMessage(error)
        throw error
      } finally {
        initializing.value = false
        initPromise = null
      }
    })()

    return initPromise
  }

  async function createUser(name: string): Promise<LocalUser> {
    await init()
    const validation = validateUserName(name, USER_NAME_MAX_LENGTH)
    if (!validation.ok) {
      throw new Error(
        validation.reason === 'empty'
          ? 'User name is required'
          : `User name must be ${USER_NAME_MAX_LENGTH} characters or fewer`,
      )
    }

    const now = Date.now()
    const user: LocalUser = {
      id: createId('user'),
      name: validation.value,
      createdAt: now,
      updatedAt: now,
    }
    await putLocalUser(user)
    users.value = [...users.value, user]

    if (!currentUserId.value) {
      currentUserId.value = user.id
      currentSaveId.value = null
      saveMetas.value = []
      await persistAppState()
    }

      const desktopError = await syncDesktopArchive(user)
      if (desktopError) {
        syncError.value = desktopError
      } else {
        syncError.value = ''
      }

    return user
  }

  async function updateUser(
    userId: string,
    patch: { name?: string; avatar?: string | null },
  ): Promise<LocalUser> {
    await init()
    const existingUser = users.value.find(user => user.id === userId)
    if (!existingUser) throw new Error('User not found')

    let name = existingUser.name
    if (patch.name !== undefined) {
      const validation = validateUserName(patch.name, USER_NAME_MAX_LENGTH)
      if (!validation.ok) {
        throw new Error(
          validation.reason === 'empty'
            ? 'User name is required'
            : `User name must be ${USER_NAME_MAX_LENGTH} characters or fewer`,
        )
      }
      name = validation.value
    }

    const updatedUser: LocalUser = {
      ...existingUser,
      name,
      updatedAt: Date.now(),
    }
    if (patch.avatar !== undefined) {
      updatedUser.avatar = patch.avatar ?? undefined
    }

    users.value = users.value.map(user => user.id === userId ? updatedUser : user)
    await putLocalUser(updatedUser)
    return updatedUser
  }

  async function selectUser(userId: string): Promise<void> {
    await init()
    if (!users.value.some(user => user.id === userId)) {
      throw new Error('User not found')
    }

    currentUserId.value = userId
    await loadCurrentUserSaves()
    const user = users.value.find(item => item.id === userId)
    currentSaveId.value = resolveCurrentSaveId(
      saveMetas.value,
      null,
      user?.lastOpenedSaveId,
    )
    await persistAppState()

    const selectedUser = users.value.find(item => item.id === userId)
    if (selectedUser) {
      const desktopError = await syncDesktopArchive(selectedUser)
      if (desktopError) {
        syncError.value = desktopError
      } else {
        syncError.value = ''
      }
    }
  }

  async function createSave(name: string, project: ProjectFile): Promise<SaveSlot> {
    await init()
    if (!currentUser.value) throw new Error('Select a local user before creating a save')

    const validation = validateSaveName(name, SAVE_NAME_MAX_LENGTH)
    if (!validation.ok) {
      throw new Error(
        validation.reason === 'empty'
          ? 'Save name is required'
          : `Save name must be ${SAVE_NAME_MAX_LENGTH} characters or fewer`,
      )
    }
    const now = Date.now()
    const meta: SaveSlot = {
      id: createId('save'),
      userId: currentUser.value.id,
      name: validation.value,
      createdAt: now,
      updatedAt: now,
      nodeCount: project.nodes.length,
      edgeCount: project.edges.length,
      projectVersion: project.version,
    }
    await putSave({ meta, project })
    saveMetas.value = [meta, ...saveMetas.value]
    currentSaveId.value = meta.id

    const user = users.value.find(item => item.id === currentUser.value?.id)
    if (user) {
      user.lastOpenedSaveId = meta.id
      user.updatedAt = now
      await putLocalUser(user)
    }
    await persistAppState()

    if (user) {
      const desktopError = await syncDesktopArchive(user, { meta, project })
      if (desktopError) {
        syncError.value = desktopError
      } else {
        syncError.value = ''
      }
    }
    return meta
  }

  async function selectSave(saveId: string): Promise<LocalSave> {
    await init()
    const meta = saveMetas.value.find(save => save.id === saveId)
    if (!meta) throw new Error('Save not found')
    const save = await getSave(saveId)
    if (!save) throw new Error('Save data is missing')

    currentSaveId.value = saveId
    const user = users.value.find(item => item.id === meta.userId)
    if (user) {
      user.lastOpenedSaveId = saveId
      user.updatedAt = Date.now()
      await putLocalUser(user)
    }
    await persistAppState()
    return { meta: save.meta, project: save.project }
  }

  async function saveCurrentProject(project: ProjectFile): Promise<SaveProjectResult> {
    await init()
    const meta = currentSaveMeta.value
    const user = currentUser.value
    if (!meta || !user) throw new Error('Select a local user and save before saving')

    const updatedMeta: SaveSlot = {
      ...meta,
      name: project.title?.trim() || meta.name,
      updatedAt: Date.now(),
      nodeCount: project.nodes.length,
      edgeCount: project.edges.length,
      projectVersion: project.version,
    }
    const save: LocalSave = { meta: updatedMeta, project }
    await putSave(save)
    saveMetas.value = saveMetas.value
      .map(item => item.id === updatedMeta.id ? updatedMeta : item)
      .sort((a, b) => b.updatedAt - a.updatedAt)

    user.lastOpenedSaveId = updatedMeta.id
    user.updatedAt = updatedMeta.updatedAt
    await putLocalUser(user)
    await persistAppState()

    const desktopError = await syncDesktopArchive(user, save)
    if (desktopError) {
      syncError.value = desktopError
    } else {
      syncError.value = ''
    }

    return {
      savedLocally: true,
      synced: !desktopError,
      syncError: desktopError ?? undefined,
    }
  }

  async function renameSave(saveId: string, name: string): Promise<void> {
    await init()
    const save = await getSave(saveId)
    if (!save) throw new Error('Save not found')
    const validation = validateSaveName(name, SAVE_NAME_MAX_LENGTH)
    if (!validation.ok) {
      throw new Error(
        validation.reason === 'empty'
          ? 'Save name is required'
          : `Save name must be ${SAVE_NAME_MAX_LENGTH} characters or fewer`,
      )
    }
    save.meta = { ...save.meta, name: validation.value, updatedAt: Date.now() }
    await putSave(save)
    saveMetas.value = saveMetas.value
      .map(item => item.id === saveId ? save.meta : item)
      .sort((a, b) => b.updatedAt - a.updatedAt)

    const user = users.value.find(item => item.id === save.meta.userId)
    if (user) {
      const desktopError = await syncDesktopArchive(user, save)
      if (desktopError) {
        syncError.value = desktopError
      } else {
        syncError.value = ''
      }
    }
  }

  async function removeSave(saveId: string): Promise<void> {
    await init()
    const meta = saveMetas.value.find(save => save.id === saveId)
    if (!meta) return

    await deleteSave(saveId)
    saveMetas.value = saveMetas.value.filter(save => save.id !== saveId)
    if (currentSaveId.value === saveId) {
      currentSaveId.value = saveMetas.value[0]?.id ?? null
    }
    const user = users.value.find(item => item.id === meta.userId)
    if (user) {
      user.lastOpenedSaveId = currentSaveId.value ?? undefined
      user.updatedAt = Date.now()
      await putLocalUser(user)
    }
    await persistAppState()

    const desktopArchive = typeof window !== 'undefined' ? window.desktopAPI?.archive : undefined
    if (desktopArchive) {
      try {
        await desktopArchive.removeSave({
          userId: meta.userId,
          saveId,
          users: cloneForDesktop(users.value),
        })
      } catch (error) {
        syncError.value = getErrorMessage(error)
      }
    }

  }

  async function removeUser(userId: string): Promise<void> {
    await init()
    if (!users.value.some(user => user.id === userId)) return

    await deleteLocalUser(userId)
    users.value = users.value.filter(user => user.id !== userId)
    if (currentUserId.value === userId) {
      currentUserId.value = users.value[0]?.id ?? null
      await loadCurrentUserSaves()
      currentSaveId.value = saveMetas.value[0]?.id ?? null
    }
    await persistAppState()

    const desktopArchive = typeof window !== 'undefined' ? window.desktopAPI?.archive : undefined
    if (desktopArchive) {
      try {
        await desktopArchive.removeUser({
          userId,
          users: cloneForDesktop(users.value),
        })
      } catch (error) {
        syncError.value = getErrorMessage(error)
      }
    }

  }

  async function startUnsavedSession(): Promise<void> {
    await init()
    currentSaveId.value = null
    await persistAppState()
  }

  return {
    initialized,
    initializing,
    initializationError,
    users,
    saveMetas,
    currentUserId,
    currentSaveId,
    currentUser,
    currentSaveMeta,
    lastProjectMeta,
    hasUsers,
    hasSaves,
    ready,
    syncError,
    init,
    createUser,
    updateUser,
    selectUser,
    createSave,
    selectSave,
    saveCurrentProject,
    renameSave,
    removeSave,
    removeUser,
    startUnsavedSession,
  }
})
