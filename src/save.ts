import * as exec from '@actions/exec'

export async function printStats(): Promise<void> {
  await exec.exec('buildcache', ['-s'])
}

async function run(): Promise<void> {
  await printStats()
}

run()

export default run
