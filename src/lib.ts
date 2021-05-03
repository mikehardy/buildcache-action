import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function printConfig(): Promise<void> {
  await exec.exec('buildcache', ['-c'])
}

export async function printStats(): Promise<void> {
  await exec.exec('buildcache', ['-s'])
}

export function getCacheKeys(): {
  base: string
  withInput: string
  unique: string
} {
  const base = 'buildcache-'

  const inputKey = core.getInput('key')
  let withInput = base
  if (inputKey) {
    withInput = `${base}-${inputKey}`
  }

  const unique = withInput + new Date().toISOString()

  return {
    base,
    withInput,
    unique
  }
}
