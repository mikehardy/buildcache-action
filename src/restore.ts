import * as path from 'path'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as toolcache from '@actions/tool-cache'

import { getCacheKeys, printConfig, printStats, zeroStats } from './lib'

export async function downloadLatest(): Promise<void> {
  // core.debug('Downloading')
  const os = process.platform
  let filename
  switch (os) {
    case 'win32':
      filename = 'buildcache-windows.zip'
      break
    case 'linux':
      filename = 'buildcache-linux.tar.gz'
      break
    case 'darwin':
    default:
      filename = 'buildcache-macos.zip'
  }

  core.info(`buildcache: release file based on runner os is ${filename}`)

  // Grab the releases page for the for the buildcache project
  try {
    let githubToken: string | undefined = core.getInput('access_token')
    if (!githubToken || githubToken === '') {
      githubToken = process.env.GITHUB_TOKEN
    }
    if (!githubToken) {
      core.setFailed(
        'No GITHUB_TOKEN available, unable to get buildcache releases.'
      )
      return
    }
    // console.log(`we have githubToken ${githubToken}`)
    const octokit = github.getOctokit(githubToken)

    const releaseInfo = await octokit.repos.getLatestRelease({
      owner: 'mbitsnbites',
      repo: 'buildcache'
    })

    // core.info(`Got release info: ${JSON.stringify(releaseInfo, null, 2)}`)
    const buildCacheReleaseUrl = `https://github.com/mbitsnbites/buildcache/releases/download/${releaseInfo.data.tag_name}/${filename}`

    if (!buildCacheReleaseUrl) {
      core.setFailed('Unable to determine release URL for buildcache')
      return
    }
    core.info(`buildcache: installing from ${buildCacheReleaseUrl}`)
    const buildcacheReleasePath = await toolcache.downloadTool(
      buildCacheReleaseUrl
    )
    core.info(`buildcache: download path ${buildcacheReleasePath}`)
    const ghWorkSpace = process.env.GITHUB_WORKSPACE
    if (!ghWorkSpace) {
      core.setFailed('process.env.GITHUB_WORKSPACE not set')
      return
    }
    await io.mkdirP(ghWorkSpace)

    let buildcacheFolder
    switch (os) {
      case 'linux':
        buildcacheFolder = await toolcache.extractTar(
          buildcacheReleasePath,
          ghWorkSpace
        )
        break
      case 'win32':
      case 'darwin':
      default:
        buildcacheFolder = await toolcache.extractZip(
          buildcacheReleasePath,
          ghWorkSpace
        )
        break
    }
    core.info(`buildcache: unpacked folder ${buildcacheFolder}`)

    const buildcacheBinFolder = path.join(buildcacheFolder, 'buildcache', 'bin')
    const buildcacheBinPath = path.join(buildcacheBinFolder, 'buildcache')
    // windows has different filename and cannot do symbolic links
    if (os !== 'win32') {
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

    // Now set up the environment by putting our path in there
    core.exportVariable('BUILDCACHE_DIR', `${ghWorkSpace}/.buildcache`)
    core.exportVariable('BUILDCACHE_MAX_CACHE_SIZE', '500000000')
    core.exportVariable('BUILDCACHE_DEBUG', 2)
    core.exportVariable(
      'BUILDCACHE_LOG_FILE',
      `${ghWorkSpace}/.buildcache/buildcache.log`
    )
    core.addPath(buildcacheBinFolder)
  } catch (e) {
    core.setFailed(`Unable to download: ${e}`)
  }
}

async function restore(): Promise<void> {
  const ghWorkSpace = process.env.GITHUB_WORKSPACE
  if (!ghWorkSpace) {
    core.setFailed('process.env.GITHUB_WORKSPACE not set')
    return
  }
  const paths = [`${ghWorkSpace}/.buildcache`]

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
  await downloadLatest()
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
}

run()

export default run

// - uses: actions/cache@v2
//   path: ~/.buildcache
//   key: ${{ runner.os }}-v1
//   pwd
//   cd $HOME
//   ls -la
//   ln -s $HOME/buildcache/bin/buildcache $HOME/buildcache/bin/clang
//   ln -s $HOME/buildcache/bin/buildcache $HOME/buildcache/bin/clang++
//   echo "BUILDCACHE_MAX_CACHE_SIZE=525288000" >> $GITHUB_ENV
//   echo "BUILDCACHE_DEBUG=2" >> $GITHUB_ENV
//   echo "BUILDCACHE_LOG_FILE=$HOME/buildcache.log" >> $GITHUB_ENV
//   echo $HOME/buildcache/bin >> $GITHUB_PATH
//   $HOME/buildcache/bin/buildcache -c
//   $HOME/buildcache/bin/buildcache -s
//   which clang
