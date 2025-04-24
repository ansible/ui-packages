import { isValidPlugin } from '@ansible/ui-plugin-sdk'
import { getInstance, init } from '@module-federation/enhanced/runtime'

export async function loadPlugin(pluginName: string, pluginUrl: string) {
  let entry = pluginUrl.endsWith('/') ? pluginUrl.slice(0, -1) : pluginUrl
  entry += '/mf-manifest.json'
  let federationHost = getInstance()
  if (!federationHost) {
    federationHost = init({ name: '', remotes: [{ name: pluginName, entry }] })
  } else {
    federationHost.registerRemotes([{ name: pluginName, entry }])
  }
  const loadedRemote = await federationHost.loadRemote(`${pluginName}/ui-plugin`).catch((e) => {
    console.error('Error loading remote:', e)
    return null
  })
  if (typeof loadedRemote === 'object' && loadedRemote !== null && 'default' in loadedRemote) {
    if (isValidPlugin(loadedRemote.default)) {
      return loadedRemote.default
    }
  }
}
