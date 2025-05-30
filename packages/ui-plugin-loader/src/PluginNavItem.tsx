export interface IPluginNavItem {
  id: string
  label?: string
  path: string
  fullPath: string
  children?: IPluginNavItem[]
  pluginName: string
  componentName?: string
}
