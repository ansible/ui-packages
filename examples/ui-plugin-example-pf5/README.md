# Ansible UI Plugin Guide

## Introduction

This guide outlines how to create UI plugins for the Ansible Automation Platform (AAP).
These plugins can be used to dynamically extend the AAP UI by  services registered with the AAP gateway.

### Key Concepts

- [UI Plugin SDK](https://github.com/ansible/ui-packages/tree/main/packages/ui-plugin-sdk): Defines interfaces for creating UI plugins.
- [Module Federation](https://module-federation.io/): Used to build and bundle plugins.
- AAP Gateway: Manages registered services and their UI plugin integrations.

## Overview

A UI Plugin allows extending the UI with new integrations dynamically loaded from the plugin.
The plugin is built using [Module Federation](https://module-federation.io/).
The resulting bundle needs to be hosted by a service which is registered with the gateway.

The AAP UI will discover services and if a service has a UI plugin,
the AAP UI will inject the UI integrations from the plugin into the AAP UI.

## UI Plugin Definition

The Ansible UI plugin framework provies the interfaces used to defined a plugin in [@ansible/ui-packages/ui-plugin-sdk](https://github.com/ansible/ui-packages/tree/main/packages/ui-plugin-sdk). See the [example plugin](https://github.com/ansible/ui-packages/blob/main/examples/ui-plugin-example-pf5/src/ExamplePlugin.tsx) in the example repo.

## Prerequsites

- Node `20.x` and up
- NPM `8.x` and up

## Getting Started

1. Clone the [Ansible UI Packages](https://github.com/ansible/ui-packages) repo

   ```
   git clone https://github.com/ansible/ui-packages
   ```

2. Make a copy of the `examples/ui-plugin-example-pf5` directory

   ```
   cp -R ui-packages/examples/ui-plugin-example-pf5 my-plugin
   ```
   
3. Change to the copy of the directory.

   ```
   cd my-plugin
   ```
   
4. Install dependencies

   ```
   npm i
   ```

5. Run tests

   ```
   npm test
   ```

6. Run the example plugin

   ```
   npm start
   ```

### Next Steps

Rename all the identifiers in the plugin.

API Calls...



### Packaging the Plugin

1. Build the plugin

   ```
   npm run build
   ```

   The `dist` folder will contain the built plugin.

2. Host the plugin in the service.

   The service should serve up the plugin files so that the plugin can be dynamically loaded from the service.

3. Register the service with the gateway and specify the plugin as part of that registration.
