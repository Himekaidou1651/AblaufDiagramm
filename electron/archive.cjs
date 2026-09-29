'use strict'

const fs = require('node:fs/promises')
const path = require('node:path')
const { app } = require('electron')

const ARCHIVE_VERSION = 1
const ID_PATTERN = /^[A-Za-z0-9_-]+$/
const EXPORT_FILENAME_PATTERN = /^[^\\/:*?"<>|]+$/
/** @brief 统一项目正文版本，必须与 src/constants/storage.ts 的 PROJECT_FILE_VERSION 保持一致。 */
const PROJECT_FILE_VERSION = '2.0.0'
const CANVAS_MIN_WIDTH = 200
const CANVAS_MIN_HEIGHT = 200
const PERSON_DATA_STRING_FIELDS = ['name', 'nativeName', 'nativeName2', 'title', 'period', 'extra', 'avatar', 'color', 'badge']

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @brief 判断是否为有限数字。 */
const isNum = Number.isFinite

/** @brief 判断是否为非空字符串。 */
const isText = value => typeof value === 'string' && value.length > 0

function getArchiveRoot() {
  if (!app.isPackaged) return path.resolve(app.getAppPath())

  // electron-builder portable exposes the original executable directory here.
  return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'))
}

function getArchiveDirectory() {
  return path.join(getArchiveRoot(), 'saves')
}

function assertSafeId(value, label) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new Error(`Invalid ${label}`)
  }
  return value
}

function assertUser(user) {
  if (!user || typeof user !== 'object') throw new Error('Invalid user')
  assertSafeId(user.id, 'user id')
  if (typeof user.name !== 'string') throw new Error('Invalid user name')
  if (!Number.isFinite(user.createdAt) || !Number.isFinite(user.updatedAt)) {
    throw new Error('Invalid user timestamps')
  }
}

/**
 * @brief 校验统一项目正文的完整结构。
 * @description 与前端严格校验规则保持一致，避免写入无法导入的存档。
 * @param {unknown} project 待校验的项目正文。
 * @return {object} 校验通过的项目正文，失败时抛出异常。
 */
function assertProject(project) {
  if (!isPlainObject(project)) throw new Error('Invalid project')
  if (project.version !== PROJECT_FILE_VERSION) {
    throw new Error(`Unsupported project version: ${String(project.version)}`)
  }
  if (typeof project.exportedAt !== 'string' || Number.isNaN(Date.parse(project.exportedAt))) {
    throw new Error('Invalid project exportedAt')
  }
  if (project.title != null && typeof project.title !== 'string') {
    throw new Error('Invalid project title')
  }

  const { viewport, canvas } = project
  if (
    !isPlainObject(viewport) ||
    !isNum(viewport.x) ||
    !isNum(viewport.y) ||
    !isNum(viewport.zoom) ||
    viewport.zoom <= 0
  ) {
    throw new Error('Invalid project viewport')
  }
  if (
    !isPlainObject(canvas) ||
    !isNum(canvas.x) ||
    !isNum(canvas.y) ||
    !isNum(canvas.width) ||
    !isNum(canvas.height) ||
    canvas.width < CANVAS_MIN_WIDTH ||
    canvas.height < CANVAS_MIN_HEIGHT
  ) {
    throw new Error('Invalid project canvas')
  }

  if (!Array.isArray(project.nodes)) throw new Error('Invalid project nodes')
  if (!Array.isArray(project.edges)) throw new Error('Invalid project edges')

  const nodeIds = new Set()
  project.nodes.forEach((node, index) => {
    if (!isPlainObject(node)) throw new Error(`Invalid node at index ${index}`)
    if (!isText(node.id)) throw new Error(`Invalid node id at index ${index}`)
    if (nodeIds.has(node.id)) throw new Error(`Duplicate node id at index ${index}`)
    nodeIds.add(node.id)

    if (node.kind !== 'person') throw new Error(`Invalid node kind at index ${index}`)
    if (!isPlainObject(node.position) || !isNum(node.position.x) || !isNum(node.position.y)) {
      throw new Error(`Invalid node position at index ${index}`)
    }
    if (
      !isPlainObject(node.size) ||
      !isNum(node.size.width) ||
      !isNum(node.size.height) ||
      node.size.width <= 0 ||
      node.size.height <= 0
    ) {
      throw new Error(`Invalid node size at index ${index}`)
    }
    if (node.data == null) return
    if (!isPlainObject(node.data)) throw new Error(`Invalid node data at index ${index}`)
    for (const field of PERSON_DATA_STRING_FIELDS) {
      const value = node.data[field]
      if (value !== undefined && value !== null && typeof value !== 'string') {
        throw new Error(`Invalid node data field ${field} at index ${index}`)
      }
    }
  })

  const edgeIds = new Set()
  project.edges.forEach((edge, index) => {
    if (!isPlainObject(edge)) throw new Error(`Invalid edge at index ${index}`)
    if (!isText(edge.id)) throw new Error(`Invalid edge id at index ${index}`)
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate edge id at index ${index}`)
    edgeIds.add(edge.id)

    if (!isText(edge.source)) throw new Error(`Invalid edge source at index ${index}`)
    if (!isText(edge.target)) throw new Error(`Invalid edge target at index ${index}`)
    if (edge.type !== 'parent' && edge.type !== 'spouse') {
      throw new Error(`Invalid edge type at index ${index}`)
    }
    if (edge.source === edge.target) throw new Error(`Self-referencing edge at index ${index}`)
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Edge endpoint is missing from nodes at index ${index}`)
    }
  })

  return project
}

/**
 * @brief 校验完整存档的 meta 与项目正文一致性。
 * @param {unknown} save 待校验的存档对象。
 * @return {void} 校验失败时抛出异常。
 */
function assertSave(save) {
  if (!isPlainObject(save) || !save.meta || !save.project) throw new Error('Invalid save')

  const { meta, project } = save
  assertSafeId(meta.id, 'save id')
  assertSafeId(meta.userId, 'save user id')
  if (typeof meta.name !== 'string' || meta.name.trim().length === 0) {
    throw new Error('Invalid save name')
  }
  if (!isNum(meta.createdAt) || !isNum(meta.updatedAt)) {
    throw new Error('Invalid save timestamps')
  }

  assertProject(project)

  if (!isNum(meta.nodeCount) || meta.nodeCount !== project.nodes.length) {
    throw new Error('Invalid save node count')
  }
  if (!isNum(meta.edgeCount) || meta.edgeCount !== project.edges.length) {
    throw new Error('Invalid save edge count')
  }
  if (meta.projectVersion !== project.version) {
    throw new Error('Save project version does not match its meta')
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), 'utf8')
  await fs.rename(tempPath, filePath)
}

async function writeTextAtomic(filePath, value) {
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, value, 'utf8')
  await fs.rename(tempPath, filePath)
}

function userSummary(user) {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastOpenedSaveId: user.lastOpenedSaveId,
  }
}

async function ensureArchiveDirectories() {
  const archiveDirectory = getArchiveDirectory()
  await fs.mkdir(path.join(archiveDirectory, 'users'), { recursive: true })
  return archiveDirectory
}

async function readArchive() {
  const archiveDirectory = await ensureArchiveDirectories()
  const usersDirectory = path.join(archiveDirectory, 'users')
  const users = []
  const saves = []
  const warnings = []

  let manifest = null
  const manifestPath = path.join(archiveDirectory, 'manifest.json')
  if (await pathExists(manifestPath)) {
    try {
      manifest = await readJson(manifestPath)
    } catch {
      warnings.push('manifest.json is invalid and was skipped')
    }
  }

  const manifestUsers = new Map(
    Array.isArray(manifest?.users)
      ? manifest.users
        .filter(item => item && typeof item.id === 'string' && ID_PATTERN.test(item.id))
        .map(item => [item.id, item])
      : [],
  )

  let userEntries = []
  try {
    userEntries = await fs.readdir(usersDirectory, { withFileTypes: true })
  } catch (error) {
    warnings.push(`Unable to read users directory: ${error.message}`)
  }

  for (const entry of userEntries) {
    if (!entry.isDirectory() || !ID_PATTERN.test(entry.name)) continue

    const userId = entry.name
    const userDirectory = path.join(usersDirectory, userId)
    const profilePath = path.join(userDirectory, 'profile.json')
    let user = null

    if (await pathExists(profilePath)) {
      try {
        user = await readJson(profilePath)
        assertUser(user)
        if (user.id !== userId) throw new Error('Profile id does not match directory')
      } catch (error) {
        warnings.push(`Skipped ${userId}/profile.json: ${error.message}`)
      }
    }

    if (!user) {
      const fallback = manifestUsers.get(userId)
      if (fallback) {
        try {
          assertUser(fallback)
          user = fallback
        } catch (error) {
          warnings.push(`Skipped manifest user ${userId}: ${error.message}`)
        }
      }
    }

    if (!user) continue
    users.push(user)

    const savesDirectory = path.join(userDirectory, 'saves')
    let saveEntries = []
    try {
      saveEntries = await fs.readdir(savesDirectory, { withFileTypes: true })
    } catch (error) {
      if (error.code !== 'ENOENT') {
        warnings.push(`Unable to read saves for ${userId}: ${error.message}`)
      }
      continue
    }

    for (const saveEntry of saveEntries) {
      if (!saveEntry.isFile() || !saveEntry.name.endsWith('.json')) continue
      const saveId = saveEntry.name.slice(0, -'.json'.length)
      if (!ID_PATTERN.test(saveId)) continue

      const savePath = path.join(savesDirectory, saveEntry.name)
      try {
        const save = await readJson(savePath)
        assertSave(save)
        if (save.meta.id !== saveId || save.meta.userId !== userId) {
          throw new Error('Save id or user id does not match its path')
        }
        saves.push(save)
      } catch (error) {
        warnings.push(`Skipped ${userId}/saves/${saveEntry.name}: ${error.message}`)
      }
    }
  }

  // A manifest entry without a directory is not enough to create a usable save.
  // Profiles remain the source of truth for the on-disk archive.
  return {
    version: ARCHIVE_VERSION,
    rootPath: archiveDirectory,
    users,
    saves,
    warnings,
  }
}

async function writeManifest(archiveDirectory, users) {
  const manifest = {
    version: ARCHIVE_VERSION,
    updatedAt: Date.now(),
    users: users.map(userSummary),
  }
  await writeJsonAtomic(path.join(archiveDirectory, 'manifest.json'), manifest)
}

async function writeUsers(archiveDirectory, users) {
  for (const item of users) {
    assertUser(item)
    const userDirectory = path.join(archiveDirectory, 'users', item.id)
    await fs.mkdir(path.join(userDirectory, 'saves'), { recursive: true })
    await writeJsonAtomic(path.join(userDirectory, 'profile.json'), item)
  }
}

async function saveArchive(payload) {
  const archiveDirectory = await ensureArchiveDirectories()
  const user = payload?.user
  const users = Array.isArray(payload?.users) ? payload.users : [user]
  assertUser(user)

  await writeUsers(archiveDirectory, users)

  if (payload.save != null) {
    assertSave(payload.save)
    if (payload.save.meta.userId !== user.id) {
      throw new Error('Save does not belong to the selected user')
    }
    const savePath = path.join(
      archiveDirectory,
      'users',
      user.id,
      'saves',
      `${payload.save.meta.id}.json`,
    )
    await writeJsonAtomic(savePath, payload.save)
  }

  await writeManifest(archiveDirectory, users)
  return { rootPath: archiveDirectory }
}

async function removeSave(payload) {
  const userId = assertSafeId(payload?.userId, 'user id')
  const saveId = assertSafeId(payload?.saveId, 'save id')
  const archiveDirectory = await ensureArchiveDirectories()
  const savePath = path.join(archiveDirectory, 'users', userId, 'saves', `${saveId}.json`)

  try {
    await fs.unlink(savePath)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  if (Array.isArray(payload.users)) {
    await writeUsers(archiveDirectory, payload.users)
    await writeManifest(archiveDirectory, payload.users)
  }
  return { rootPath: archiveDirectory }
}

async function removeUser(payload) {
  const userId = assertSafeId(payload?.userId, 'user id')
  const archiveDirectory = await ensureArchiveDirectories()
  const userDirectory = path.join(archiveDirectory, 'users', userId)
  await fs.rm(userDirectory, { recursive: true, force: true })
  if (Array.isArray(payload.users)) {
    await writeManifest(archiveDirectory, payload.users)
  }
  return { rootPath: archiveDirectory }
}

function sanitizeExportFilename(filename) {
  if (typeof filename !== 'string' || !filename || path.basename(filename) !== filename) {
    throw new Error('Invalid export filename')
  }
  if (!EXPORT_FILENAME_PATTERN.test(filename)) throw new Error('Invalid export filename')
  return filename
}

async function saveExportFile(payload) {
  const filename = sanitizeExportFilename(payload?.filename)
  const archiveDirectory = await ensureArchiveDirectories()
  const filePath = path.join(archiveDirectory, filename)
  const data = payload?.data

  if (typeof data === 'string') {
    await writeTextAtomic(filePath, data)
  } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    const buffer = Buffer.from(data instanceof ArrayBuffer ? data : data.buffer, data.byteOffset || 0, data.byteLength)
    const tempPath = `${filePath}.tmp`
    await fs.writeFile(tempPath, buffer)
    await fs.rename(tempPath, filePath)
  } else {
    throw new Error('Invalid export data')
  }

  return {
    rootPath: archiveDirectory,
    relativePath: path.join('saves', filename),
  }
}

module.exports = {
  getArchiveDirectory,
  readArchive,
  saveArchive,
  removeSave,
  removeUser,
  saveExportFile,
}
