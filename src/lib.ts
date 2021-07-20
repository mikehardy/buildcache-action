import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'

async function execBuildCacheWithoutImpersonation(arg: string): Promise<void> {
  const env = { ...process.env } as exec.ExecOptions['env']
  delete env?.BUILDCACHE_IMPERSONATE
  await exec.exec('buildcache', [arg], { env })
}

export async function printConfig(): Promise<void> {
  await execBuildCacheWithoutImpersonation('-c')
}

export async function printStats(): Promise<void> {
  await execBuildCacheWithoutImpersonation('-s')
}

export async function zeroStats(): Promise<void> {
  await execBuildCacheWithoutImpersonation('-z')
}

export function getEnvVar(
  key: string,
  defaultValue: string,
  quiet = false
): string {
  if (!quiet) {
    core.debug(`buildcache: getEnvVar value of ${key}? '${process.env[key]}'`)
  }
  return process.env[key] ?? defaultValue
}

// returns the current access token or fails if undefined
export function getAccessToken(): string {
  // Attempt to take GITHUB_TOKEN from env first, otherwise take action.yaml key
  const githubToken = getEnvVar(
    'GITHUB_TOKEN',
    core.getInput('access_token'),
    true
  )
  if (!githubToken || githubToken === '') {
    throw new Error(
      'GITHUB_TOKEN environment variable or access_token action parameter must be provided'
    )
  }
  return githubToken
}

export async function getInstallDir(): Promise<string> {
  let installDir = core.getInput('install_dir')
  if (!installDir || installDir === '') {
    installDir = getEnvVar('GITHUB_WORKSPACE', '')
  }
  if (!installDir || installDir === '') {
    throw new Error('install_dir not specified or empty')
  }
  await io.mkdirP(installDir)
  return installDir
}

export function getCacheKeys(): {
  base: string
  withInput: string
  unique: string
} {
  const base = 'buildcache'

  // TODO - remove `key` here and from action.yaml in v2, deprecated as of v1.1.1
  const inputKey = core.getInput('cache_key') ?? core.getInput('key')
  let withInput = base
  if (inputKey) {
    withInput = `${base}-${inputKey}`
  }

  // Key generation is important. Always specify a unique primary key to github because caches are immutable.
  // A unique primary key means a new cache with updated contents will be saved for future runs.
  // But specifying a good base restore key means a previous cache will be restored as fallback
  // https://github.com/actions/cache/issues/342#issuecomment-673371329
  const unique = `${withInput}-${new Date().toISOString()}`

  return {
    base,
    withInput,
    unique
  }
}
