/* eslint-disable no-console */
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as rimraf from 'rimraf'
import { getInstallDir } from '../src/lib'

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

test('test bundled restore runs', async () => {
  const np = process.execPath

  const installDir = await getInstallDir()
  const env = process.env
  env['PATH'] = `${installDir}/buildcache/bin:${env['PATH']}`
  const options: cp.ExecFileSyncOptions = {
    env
  }

  const rp = path.join(__dirname, '..', 'dist', 'restore', 'index.js')
  console.log(cp.execFileSync(np, ['--trace-warnings', rp], options).toString())

  // assert that the binary is in ghWorkspace/buildcache/bin/buildcache
  // assert that the symbolic links to clang and clang++ are there
  // assert that ghWorkspace/buildcache/bin is in GITHUB_PATH
  // assert that config items are in GITHUB_ENV

  const sp = path.join(__dirname, '..', 'dist', 'save', 'index.js')
  console.log(cp.execFileSync(np, ['--trace-warnings', sp], options).toString())
})
