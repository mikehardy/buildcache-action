import * as cache from '@actions/cache'
import * as core from '@actions/core'

import { getCacheKeys, printStats } from './lib'

async function save(): Promise<void> {
  const { unique } = getCacheKeys()

  const ghWorkSpace = process.env.GITHUB_WORKSPACE
  if (!ghWorkSpace) {
    core.setFailed('process.env.GITHUB_WORKSPACE not set')
    return
  }
  const paths = [`${ghWorkSpace}/.buildcache`]

  core.info(`Save cache using key "${unique}".`)
  try {
    await cache.saveCache(paths, unique)
  } catch (e) {
    core.warning(`caching not working: ${e}`)
  }
}

async function run(): Promise<void> {
  await printStats()
  await save()
}

run()

export default run
