import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function printStats(): Promise<void> {
  await exec.exec('buildcache', ['-s'])
}

async function save(): Promise<void> {
  let restoreKey = `buildcache-`
  const inputKey = core.getInput('key')

  if (inputKey) {
    restoreKey += `${inputKey}-`
  }

  const key = restoreKey + new Date().toISOString()
  const paths = ['.buildcache']

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
