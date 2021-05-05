import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function printConfig(): Promise<void> {
  await exec.exec('buildcache', ['-c'])
}

export async function printStats(): Promise<void> {
  await exec.exec('buildcache', ['-s'])
}

export async function zeroStats(): Promise<void> {
  await exec.exec('buildcache', ['-z'])
}

export function getCacheKeys(): {
  base: string
  withInput: string
  unique: string
} {
  const base = 'buildcache-'

  // TODO - remove `key` here and from action.yaml in v2, deprecated as of v1.1.1
  const inputKey = core.getInput('cache_key') ?? core.getInput('key')
  let withInput = base
  if (inputKey) {
    withInput = `${base}-${inputKey}`
  }

  const unique = `${withInput}-${new Date().toISOString()}`

  return {
    base,
    withInput,
    unique
  }
}
