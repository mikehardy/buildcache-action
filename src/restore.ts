import * as path from 'path'
import * as stream from 'stream'
import * as core from '@actions/core'
import * as io from '@actions/io'
import * as toolcache from '@actions/tool-cache'
import * as exec from '@actions/exec'

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

  core.info(`release filename based on runner os is ${filename}`)

  const options: exec.ExecOptions = {}

  let myOutput = ''
  const ws = new stream.Writable()
  ws._write = (chunk, _encoding, next) => {
    myOutput += chunk.toString()
    next()
  }
  options.outStream = ws

  // Grab the releases page for the for the buildcache project
  try {
    await exec.exec(
      'curl',
      [
        '-s',
        'https://api.github.com/repos/mbitsnbites/buildcache/releases/latest'
      ],
      options
    )
    core.info(`we have curl output of? ${myOutput.toString()}`)
    const buildCacheReleaseUrl = myOutput
      .toString()
      .match(new RegExp(`https://.*${filename}`))

    if (!buildCacheReleaseUrl) {
      core.setFailed('Unable to determine release URL for buildcache')
      return
    }
    core.info(`we have a download url? ${buildCacheReleaseUrl}`)
    const buildcacheReleasePath = await toolcache.downloadTool(
      buildCacheReleaseUrl[0]
    )
    core.info(`we have a tool download path of ${buildcacheReleasePath}`)
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
    core.info(`we have a folder of ${buildcacheFolder}`)

    // symbolic links are one thing but are they cross platform? cp should be better?
    const buildcacheBinFolder = path.join(buildcacheFolder, 'buildcache', 'bin')
    let buildcacheBinPath = path.join(buildcacheBinFolder, 'buildcache')
    if (os === 'win32') {
      buildcacheBinPath += '.exe'
    }
    await io.cp(buildcacheBinPath, path.join(buildcacheBinFolder, 'clang'))
    await io.cp(buildcacheBinPath, path.join(buildcacheBinFolder, 'clang++'))

    // Now set up the environment by putting our path in there
    core.exportVariable('BUILDCACHE_DIR', `${ghWorkSpace}/.buildcache`)
    core.exportVariable('BUILDCACHE_MAX_CACHE_SIZE', '500000000')
    core.exportVariable('BUILDCACHE_DEBUG', 2)
    core.exportVariable(
      'BUILDCACHE_LOG_FILE',
      `${ghWorkSpace}/.buildcache/buildcache.log`
    )
    core.addPath(buildcacheBinFolder)

    await exec.exec('buildcache', ['-c'])
    await exec.exec('buildcache', ['-s'])
  } catch (e) {
    core.setFailed(`Unable to download: ${e}`)
  }
}

async function run(): Promise<void> {
  await downloadLatest()
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
