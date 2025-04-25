import { getInstance, init } from '@module-federation/enhanced/runtime'

export async function loadPlugin({
  pluginName,
  pluginUrl,
  lang = 'en',
  locale = 'en-US',
}: {
  pluginName: string
  pluginUrl: string
  lang: string
  locale: string
}) {
  let entry = pluginUrl.endsWith('/') ? pluginUrl.slice(0, -1) : pluginUrl
  entry += '/mf-manifest.json'
  let federationHost = getInstance()
  if (!federationHost) {
    federationHost = init({ name: 'remote-app', remotes: [{ name: pluginName, entry }] })
  } else {
    federationHost.registerRemotes([{ name: pluginName, entry }])
  }
  const loadedRemote = await federationHost.loadRemote(`${pluginName}/ui-plugin`).catch((e) => {
    console.error('Error loading remote:', e)
    return null
  })
  if (typeof loadedRemote === 'object' && loadedRemote !== null && 'default' in loadedRemote) {
    if (loadedRemote.default && typeof loadedRemote.default === 'function') {
      return loadedRemote.default({ lang, locale })
    }
  }
  return new Error(`Invalid plugin: ${pluginName} from ${pluginUrl}`)
}
