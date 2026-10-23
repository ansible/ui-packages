# Contributing

Thanks for contributing to the Ansible UI packages workspace. Follow the
[Code of Conduct](CODE-OF-CONDUCT.md) when participating in this project.

## Development setup

Use Node `^22.23.4 || >=24` and npm. Install dependencies with:

```sh
npm ci
```

Run the configured workspace checks with:

```sh
npm test
```

GitHub Actions also runs the relevant checks for pull requests.

## Changesets

Add a Changeset for every release-worthy change to a Changesets-managed
package. See [RELEASING.md](RELEASING.md) for package ownership and the current
release boundary. Publishing is disabled unless a separate change enables it.

## AI-assisted contributions

See [AI_POLICY.md](AI_POLICY.md) for this repository's policy on AI-assisted
contributions and the governing Ansible Community policy.
