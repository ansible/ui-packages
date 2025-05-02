import { isValidPlugin } from '@ansible/ui-plugin-sdk'
import { getInstance, init } from '@module-federation/enhanced/runtime'

export async function loadPlugin({ name, entry, lang = 'en' }: { name: string; entry: string; lang: string }) {
  let federationHost = getInstance()
  if (!federationHost) {
    federationHost = init({ name: 'ui-plugin', remotes: [{ name, entry, type: 'module' }] })
  } else {
    federationHost.registerRemotes([{ name, entry, type: 'module' }])
  }
  const loadedRemote = await federationHost.loadRemote(`${name}/ui-plugin`)
  if (typeof loadedRemote === 'object' && loadedRemote !== null && 'default' in loadedRemote) {
    if (loadedRemote.default && typeof loadedRemote.default === 'function') {
      const plugin = loadedRemote.default({ lang })
      if (isValidPlugin(plugin)) {
        return plugin
      }
    }
  }
  throw new Error(`Invalid plugin: ${name} from ${entry}`)
}
