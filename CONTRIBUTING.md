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

## Environment configuration

Use Varlock schemas for environment variables. The root `.env.schema` holds
shared settings; apps add a nearby `.env.schema` and import only the shared
items they use. Packages without environment variables do not need a schema.
Keep local values in ignored `.env.local` files, mark secrets sensitive, and
never commit plaintext `.env` files.

Validate the schemas with:

```sh
npm exec -- varlock load --agent
npm exec -- varlock load --agent --path examples/ui-plugin-example-pf5/
```

## Changesets

Add a Changeset for every release-worthy change to a Changesets-managed
package. See [RELEASING.md](RELEASING.md) for package ownership and the current
release boundary. Publishing is disabled unless a separate change enables it.

When a publish job runs, it sends a Slack notification after successful
publication. Configure `SLACK_WEBHOOK_URL` as a repository GitHub Actions
secret. Do not add it to `.env.schema` or commit its value.

## AI-assisted contributions

See [AI_POLICY.md](AI_POLICY.md) for this repository's policy on AI-assisted
contributions and the governing Ansible Community policy.
