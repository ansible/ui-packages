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

You may use AI tools while preparing a contribution. You remain responsible for
the submitted changes. Review generated code and documentation, verify sources
and licenses, and run the relevant checks. Disclose substantial AI assistance
in the pull request description, including the tool and the work it supported.
Do not send secrets, personal data, or confidential information to external AI
services.
