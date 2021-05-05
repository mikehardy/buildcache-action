import * as artifact from '@actions/artifact'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as io from '@actions/io'

import { getCacheKeys, printStats } from './lib'

async function save(): Promise<void> {
  const { unique } = getCacheKeys()

  const ghWorkSpace = process.env.GITHUB_WORKSPACE
  if (!ghWorkSpace) {
    core.setFailed('process.env.GITHUB_WORKSPACE not set')
    return
  }
  const paths = [`${ghWorkSpace}/.buildcache`]

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

  const ghWorkSpace = process.env.GITHUB_WORKSPACE
  if (!ghWorkSpace) {
    core.setFailed('process.env.GITHUB_WORKSPACE not set')
    return
  }

  const files = [`${ghWorkSpace}/.buildcache/buildcache.log`]
  const rootDirectory = `${ghWorkSpace}/.buildcache/`
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
    await io.rmRF('./.buildcache/buildcache.log')
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
