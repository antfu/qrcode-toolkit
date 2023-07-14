import { defineNuxtModule } from '@nuxt/kit'
import { simpleGit } from 'simple-git'
import { version } from '../package.json'

export default defineNuxtModule({
  async setup(_, nuxt) {
    const git = simpleGit()
    nuxt.options.runtimeConfig.public.version = version
    nuxt.options.runtimeConfig.public.buildTime = +new Date()
    nuxt.options.runtimeConfig.public.git = {
      branch: (await git.branch()).current,
      sha: (await git.revparse(['HEAD'])).trim(),
    }
  },
})
