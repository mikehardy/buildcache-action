/* eslint-disable no-console */
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as rimraf from 'rimraf'
import * as fs from 'fs'
import { getInstallDir } from '../src/lib'

jest.setTimeout(40000)

const cachePath = path.join(__dirname, 'runner', 'CACHE')
const tempPath = path.join(__dirname, 'runner', 'TEMP')
const ghWorkspace = path.join(__dirname, 'runner', 'WORKSPACE')
const buildcacheDir = path.join(ghWorkspace, '.buildcache', 'cache')

// Set temp and tool directories before importing (used to set global state)
process.env['RUNNER_TEMP'] = tempPath
process.env['RUNNER_TOOL_CACHE'] = cachePath
process.env['GITHUB_WORKSPACE'] = ghWorkspace
process.env['BUILDCACHE_DIR'] = buildcacheDir

beforeEach(() => {
  rimraf.sync(cachePath)
  rimraf.sync(tempPath)
  rimraf.sync(ghWorkspace)

  fs.mkdirSync(ghWorkspace, { recursive: true })
})

// test('downloads latest buildcache', async () => {
//   await expect(downloadLatest()).rejects.toThrow('Unable to download')
// })

type Input = { [key: string]: string }

function mapInputToEnv(input: Input): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {}
  for (let key in input) {
    result[`INPUT_${key.toUpperCase()}`] = input[key]
  }
  return result
}

test('test bundled restore runs', async () => {
  const np = process.execPath

  const installDir = await getInstallDir()
  const PATH = `${installDir}/buildcache/bin:${process.env['PATH']}`
  const options = {
    env: {
      ...process.env,
      PATH,
      ...mapInputToEnv({
        buildcache_tag: process.env['ACTION_BUILDCACHE_TAG'] || 'latest'
      })
    }
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

describe('save cache', () => {
  const np = process.execPath
  const rp = path.join(__dirname, '..', 'dist', 'restore', 'index.js')
  const sp = path.join(__dirname, '..', 'dist', 'save', 'index.js')
  let PATH: string
  let cc: string

  beforeAll(async () => {
    const installDir = await getInstallDir()
    PATH = `${installDir}/buildcache/bin:${process.env['PATH']}`
    cc = path.join(installDir, 'buildcache', 'bin', 'clang++')
  })

  async function restore(input: Input = {}) {
    const options = {
      env: {
        ...process.env,
        PATH,
        ...mapInputToEnv(input)
      }
    }

    const o = cp.execFileSync(np, ['--trace-warnings', rp], options).toString()
    console.log(o)
    return o
  }

  async function save(input: Input = {}) {
    const options = {
      env: {
        ...process.env,
        PATH,
        ...mapInputToEnv(input)
      }
    }

    const o = cp.execFileSync(np, ['--trace-warnings', sp], options).toString()
    console.log(o)
    return o
  }

  async function compile(file: string) {
    const options = {
      env: {
        ...process.env,
        PATH
      },
      cwd: ghWorkspace
    }

    const o = cp
      .execFileSync(cc, [file, '-c', '-o', `${file}.o`], options)
      .toString()
    console.log(o)
    return o
  }

  describe('with new file to compile', () => {
    let file: string

    beforeEach(() => {
      file = Math.random().toString().substring(2) + '.cc'
      fs.writeFileSync(path.join(ghWorkspace, file), 'int main() {}')
    })

    test('it should store cache', async () => {
      const input = {
        buildcache_tag: process.env['ACTION_BUILDCACHE_TAG'] || 'latest'
      }
      await restore(input)
      await compile(file)
      const o = await save()

      expect(o).toMatch(/buildcache: saving cache with key /)
    })

    test('it should not store cache if save_cache is false', async () => {
      const input = {
        save_cache: 'false',
        buildcache_tag: process.env['ACTION_BUILDCACHE_TAG'] || 'latest'
      }
      await restore(input)
      await compile(file)
      const o = await save(input)

      expect(o.split('\n')).toContain('buildcache: not saving cache.')
    })

    test('it should not store cache if it is empty', async () => {
      const input = {
        buildcache_tag: process.env['ACTION_BUILDCACHE_TAG'] || 'latest'
      }
      await restore(input)
      const o = await save()

      expect(o.split('\n')).toContain('buildcache: not saving empty cache.')
    })

    describe('with entries already cached', () => {
      beforeEach(async () => {
        const input = {
          buildcache_tag: process.env['ACTION_BUILDCACHE_TAG'] || 'latest'
        }
        // add entries to cache
        await restore(input)
        await compile(file)
        await save()

        rimraf.sync(path.join(ghWorkspace, 'buildcache'))
      })

      test('it should not store cache if nothing was added', async () => {
        const input = {
          zero_buildcache_stats: 'true',
          buildcache_tag: process.env['ACTION_BUILDCACHE_TAG'] || 'latest'
        }
        await restore(input)
        await compile(file)
        const o = await save()

        expect(o.split('\n')).toContain(
          'buildcache: not saving unmodified cache.'
        )
      })
    })
  })
})
