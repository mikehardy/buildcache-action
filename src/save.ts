import * as cache from '@actions/cache'
import * as core from '@actions/core'

import { printStats } from './lib'

async function save(): Promise<void> {
  let restoreKey = `buildcache-`
  const inputKey = core.getInput('key')

  if (inputKey) {
    restoreKey += `${inputKey}-`
  }

  const key = restoreKey + new Date().toISOString()
  const ghWorkSpace = process.env.GITHUB_WORKSPACE
  if (!ghWorkSpace) {
    core.setFailed('process.env.GITHUB_WORKSPACE not set')
    return
  }
  const paths = [`${ghWorkSpace}/.buildcache`]

  core.info(`Save cache using key "${key}".`)
  try {
    await cache.saveCache(paths, key)
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
