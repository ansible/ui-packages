# Usage

Install the packages your project needs from npm. UI plugin projects typically
use the SDK, loader, and PatternFly 5 integration packages:

```sh
npm install @ansible/ui-plugin-sdk @ansible/ui-plugin-loader @ansible/ui-plugin-pf5
```

For an example plugin, clone this repository, install its workspaces, and start
the PatternFly 5 example from the repository root:

```sh
git clone https://github.com/ansible/ui-packages.git
cd ui-packages
npm ci
npm run start --workspace=@ansible/ui-plugin-example-pf5
```

The example source and setup notes are in the
[example project](https://github.com/ansible/ui-packages/tree/main/examples/ui-plugin-example-pf5).

## Frontend tooling

Install the ESLint plugin as a development dependency and add its recommended
flat config to your ESLint configuration:

```sh
npm install --save-dev @ansible/eslint-plugin eslint@^10
```

```js
import ansible from '@ansible/eslint-plugin'

export default [...ansible.configs.recommended]
```

For Markdown link checking, install `@ansible/md-link-lint` and run its CLI from
the repository root:

```sh
npm install --save-dev @ansible/md-link-lint
npx md-link-lint
```

See the package READMEs in the
[source repository](https://github.com/ansible/ui-packages/tree/main/packages)
for configuration options and more examples.
