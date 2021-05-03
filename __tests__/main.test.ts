/* eslint-disable no-console */
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as rimraf from 'rimraf'

// import { downloadLatest } from '../lib/restore'

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

test('test bundled restore runs', () => {
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'dist', 'restore', 'index.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())

  // assert that the binary is in ghWorkspace/buildcache/bin/buildcache
  // assert that the symbolic links to clang and clang++ are there
  // assert that ghWorkspace/buildcache/bin is in GITHUB_PATH
  // assert that config items are in GITHUB_ENV
})

test('test bundled save runs', () => {
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'dist', 'save', 'index.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
