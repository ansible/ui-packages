# Contributing

Contributions to code and documentation are welcome. Follow the repository's
[contribution guidance](https://github.com/ansible/ui-packages/blob/main/CONTRIBUTING.md),
[Code of Conduct](https://github.com/ansible/ui-packages/blob/main/CODE-OF-CONDUCT.md),
and [AI contribution policy](https://github.com/ansible/ui-packages/blob/main/AI_POLICY.md).

## Set up the repository

Use Node.js `^22.23.4 || >=24` and npm. From the repository root, install the
dependencies and run the workspace checks:

```sh
npm ci
npm test
```

GitHub Actions also runs checks for pull requests. If a change affects a
published package, follow the Changesets guidance in the repository's
contribution document.

## Preview this documentation

The docs build requires Python 3.11 or later. From the repository root, create
and activate a virtual environment, then install the pinned documentation
dependencies:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r docs/requirements.txt
```

Start the local preview server with:

```sh
python -m mkdocs serve
```

Build the site with strict link and configuration checks before submitting a
documentation change:

```sh
python -m mkdocs build --strict
```
