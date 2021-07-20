import * as path from 'path'
import * as artifact from '@actions/artifact'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as io from '@actions/io'

import { getCacheKeys, getEnvVar, getInstallDir, printStats } from './lib'

async function save(): Promise<void> {
  const { unique } = getCacheKeys()

  const installDir = await getInstallDir()
  const cacheDir = getEnvVar(
    'BUILDCACHE_DIR',
    path.join(installDir, '.buildcache')
  )
  const paths = [cacheDir]

  core.info(`buildcache: saving cache with key "${unique}".`)
  try {
    await cache.saveCache(paths, unique)
  } catch (e) {
    core.warning(`buildcache: caching not working: ${e}`)
  }
}

async function uploadBuildLog(): Promise<void> {
  const artifactClient = artifact.create()
  const artifactName = 'buildcache_log'

  const installDir = await getInstallDir()
  const cacheDir = getEnvVar(
    'BUILDCACHE_DIR',
    path.join(installDir, '.buildcache')
  )
  const logFile = getEnvVar(
    'BUILDCACHE_LOG_FILE',
    path.join(cacheDir, 'buildcache.log')
  )
  const files = [logFile]
  // FIXME this won't strip the leading directories off custom log file locations correctly!
  // It still has the built in assumption that the log file is located inside the cache directory
  const rootDirectory = cacheDir
  const options = {
    continueOnError: false
  }

  const uploadFlag = core.getInput('upload_buildcache_log')
  if (uploadFlag && uploadFlag === 'true') {
    try {
      const uploadResponse = await artifactClient.uploadArtifact(
        artifactName,
        files,
        rootDirectory,
        options
      )
      core.info(
        `buildcache: uploaded buildcache.log file (consumed ${uploadResponse.size} bytes of artifact storage)`
      )
    } catch (e) {
      core.warning(`buildcache: unable to upload buildlog: ${e}`)
    }
  }
  try {
    await io.rmRF(logFile)
  } catch (e) {
    core.warning(`buildcache: unable to delete buildcache.log ${e}`)
  }
}

async function run(): Promise<void> {
  await printStats()
  await uploadBuildLog()
  await save()
}

run()

export default run
