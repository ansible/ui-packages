import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PluginInfo, PluginsContext, usePlugins } from '../src/PluginsContext'

describe('PluginsContext', () => {
  it('should provide default values', () => {
    const { result } = renderHook(() => usePlugins(), {
      wrapper: ({ children }) => (
        <PluginsContext.Provider
          value={{
            plugins: [],
            pluginInfo: [],
            addPlugin: vi.fn(),
            removePlugin: vi.fn(),
          }}
        >
          {children}
        </PluginsContext.Provider>
      ),
    })

    expect(result.current.plugins).toEqual([])
    expect(result.current.pluginInfo).toEqual([])
    expect(typeof result.current.addPlugin).toBe('function')
    expect(typeof result.current.removePlugin).toBe('function')
  })

  it('should call addPlugin function', () => {
    const addPluginMock = vi.fn()
    const { result } = renderHook(() => usePlugins(), {
      wrapper: ({ children }) => (
        <PluginsContext.Provider
          value={{
            plugins: [],
            pluginInfo: [],
            addPlugin: addPluginMock,
            removePlugin: vi.fn(),
          }}
        >
          {children}
        </PluginsContext.Provider>
      ),
    })

    const pluginInfo: PluginInfo = { name: 'TestPlugin', url: 'http://test.com' }
    act(() => {
      result.current.addPlugin(pluginInfo)
    })

    expect(addPluginMock).toHaveBeenCalledWith(pluginInfo)
  })

  it('should call removePlugin function', () => {
    const removePluginMock = vi.fn()
    const { result } = renderHook(() => usePlugins(), {
      wrapper: ({ children }) => (
        <PluginsContext.Provider
          value={{
            plugins: [],
            pluginInfo: [],
            addPlugin: vi.fn(),
            removePlugin: removePluginMock,
          }}
        >
          {children}
        </PluginsContext.Provider>
      ),
    })

    const pluginName = 'TestPlugin'
    act(() => {
      result.current.removePlugin(pluginName)
    })

    expect(removePluginMock).toHaveBeenCalledWith(pluginName)
  })
})
