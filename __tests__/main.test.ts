/* eslint-disable no-console */
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as rimraf from 'rimraf'
import { downloadLatest, install } from '../src/restore'
import { getInstallDir, getAccessToken } from '../src/lib'

// import { downloadLatest } from '../lib/restore'

jest.setTimeout(40000)

const cachePath = path.join(__dirname, 'runner', 'CACHE')
const tempPath = path.join(__dirname, 'runner', 'TEMP')
const ghWorkspace = path.join(__dirname, 'runner', 'WORKSPACE')

// Set temp and tool directories before importing (used to set global state)
process.env['RUNNER_TEMP'] = tempPath
process.env['RUNNER_TOOL_CACHE'] = cachePath
process.env['GITHUB_WORKSPACE'] = ghWorkspace

beforeEach(() => {
  rimraf.sync(cachePath)
  rimraf.sync(tempPath)
  rimraf.sync(ghWorkspace)
})

// test('downloads latest buildcache', async () => {
//   await expect(downloadLatest()).rejects.toThrow('Unable to download')
// })

function wait(time: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

test('test bundled restore runs', async () => {
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'dist', 'restore', 'index.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, ['--trace-warnings', ip], options).toString())

  // sigh
  await Promise.resolve()
  await wait(20000)

  // assert that the binary is in ghWorkspace/buildcache/bin/buildcache
  // assert that the symbolic links to clang and clang++ are there
  // assert that ghWorkspace/buildcache/bin is in GITHUB_PATH
  // assert that config items are in GITHUB_ENV
})

test('test bundled save runs', async () => {
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'dist', 'save', 'index.js')

  // In a unit test scenario @actions/core has not prepended our installed binary to the path
  // We need to install the path ourselves
  const installDir = await getInstallDir()
  const downloadPath = await downloadLatest(getAccessToken())
  await install(downloadPath)

  const env = process.env
  env['PATH'] = `${installDir}/buildcache/bin:${env['PATH']}`
  const options: cp.ExecFileSyncOptions = {
    env
  }
  console.log(cp.execFileSync(np, ['--trace-warnings', ip], options).toString())

  // sigh
  await Promise.resolve()
  await wait(20000)
})
