import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as path from 'path'
import * as toolcache from '@actions/tool-cache'

import {
  getAccessToken,
  getCacheDir,
  getCacheKeys,
  getEnvVar,
  getInstallDir,
  printConfig,
  printStats,
  zeroStats
} from './lib'

// Downloads the latest buildcache release for this OS
// accessToken is a valid github token to access APIs
// returns path to the downloaded file
export async function downloadLatest(accessToken: string): Promise<string> {
  // Determine correct file name
  let filename = 'buildcache-macos.zip' // our default
  switch (process.platform) {
    case 'win32':
      filename = 'buildcache-windows.zip'
      break
    case 'linux':
      filename = 'buildcache-linux.tar.gz'
      break
  }
  core.info(`buildcache: release file based on runner os is ${filename}`)

  // Grab the releases page for the for the buildcache project
  const octokit = github.getOctokit(accessToken)

  // Should we get the latest, or has the user provided a tag?
  const buildcacheTag = core.getInput('buildcache_tag')
  let releaseInfo
  if (!buildcacheTag || buildcacheTag.toLowerCase() === 'latest') {
    releaseInfo = await octokit.rest.repos.getLatestRelease({
      owner: 'mbitsnbites',
      repo: 'buildcache'
    })
  } else {
    releaseInfo = await octokit.rest.repos.getReleaseByTag({
      owner: 'mbitsnbites',
      repo: 'buildcache',
      tag: buildcacheTag
    })
    if (!releaseInfo) {
      throw new Error(
        `Unable to find a buildcache release with tag '${buildcacheTag}'`
      )
    }
  }

  // core.info(`Got release info: ${JSON.stringify(releaseInfo, null, 2)}`)
  const buildCacheReleaseUrl = `https://github.com/mbitsnbites/buildcache/releases/download/${releaseInfo.data.tag_name}/${filename}`

  if (!buildCacheReleaseUrl) {
    throw new Error('Unable to determine release URL for buildcache')
  }
  core.info(`buildcache: installing from ${buildCacheReleaseUrl}`)
  const buildcacheReleasePath = await toolcache.downloadTool(
    buildCacheReleaseUrl
  )
  core.info(`buildcache: download path ${buildcacheReleasePath}`)
  return buildcacheReleasePath
}

export async function install(sourcePath: string): Promise<void> {
  const destPath = await getInstallDir()
  await io.mkdirP(destPath)

  let buildcacheFolder
  switch (process.platform) {
    case 'linux':
      buildcacheFolder = await toolcache.extractTar(sourcePath, destPath)
      break
    case 'win32':
    case 'darwin':
    default:
      buildcacheFolder = await toolcache.extractZip(sourcePath, destPath)
      break
  }
  core.info(`buildcache: unpacked folder ${buildcacheFolder}`)

  const buildcacheBinFolder = path.resolve(
    buildcacheFolder,
    'buildcache',
    'bin'
  )
  const buildcacheBinPath = path.join(buildcacheBinFolder, 'buildcache')
  // windows has different filename and cannot do symbolic links
  if (process.platform !== 'win32') {
    await exec.exec('ln', [
      '-s',
      buildcacheBinPath,
      path.join(buildcacheBinFolder, 'clang')
    ])
    await exec.exec('ln', [
      '-s',
      buildcacheBinPath,
      path.join(buildcacheBinFolder, 'clang++')
    ])
  }
  core.addPath(buildcacheBinFolder)
}

async function configure(): Promise<void> {
  // Set up the environment by putting our path in there
  const cacheDir = await getCacheDir()
  core.exportVariable('BUILDCACHE_DIR', cacheDir)
  core.exportVariable(
    'BUILDCACHE_MAX_CACHE_SIZE',
    getEnvVar('BUILDCACHE_MAX_CACHE_SIZE', '500000000')
  )
  core.exportVariable('BUILDCACHE_DEBUG', getEnvVar('BUILDCACHE_DEBUG', '2'))
  core.exportVariable(
    'BUILDCACHE_LOG_FILE',
    path.resolve(cacheDir, getEnvVar('BUILDCACHE_LOG_FILE', 'buildcache.log'))
  )
}

async function restore(): Promise<void> {
  const paths = [await getCacheDir()]

  // withInput restores immutable cache from previous runs, unique creates fresh upload post-run
  const { withInput, unique } = getCacheKeys()
  const restoreKeys = [withInput]

  try {
    const restoredWith = await cache.restoreCache(paths, unique, restoreKeys)
    if (restoredWith) {
      core.info(`buildcache: restored from cache key "${restoredWith}".`)
    } else {
      core.info(
        `buildcache: no cache for key ${unique} or ${withInput} - cold cache or invalid key`
      )
    }
  } catch (e) {
    core.warning(`buildcache: caching not working: ${e}`)
  }
}

async function run(): Promise<void> {
  try {
    const downloadPath = await downloadLatest(getAccessToken())
    await install(downloadPath)
    await configure()
    await restore()
    await printConfig()
    await printStats()
    const zeroStatsFlag = core.getInput('zero_buildcache_stats')
    if (zeroStatsFlag && zeroStatsFlag === 'true') {
      core.info(
        'buildcache: zeroing stats - stats display in cleanup task will be for this run only.'
      )
      await zeroStats()
    }
  } catch (e) {
    core.error(`buildcache: failure during restore: ${e}`)
    core.setFailed(e as Error)
  }
}

run()

export default run
