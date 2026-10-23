# Frontend contribution guide

Start with [contributing](docs/contributing.md#getting-started), then read the
[review process](docs/review.md#review-process).

See [install section](docs/contributing.md#install-the-cli) and
[second usage](docs/contributing.md#usage-1).

The [design notes](docs/design-notes.markdown?view=compact#overview) explain the layout.
The [review policy](/docs/review.md#review-process) is in the docs directory.
The [implementation](src/index.ts#L12) shows the current entry point.
Other headings: [linked](docs/contributing.md#linked-section), [image alt](docs/contributing.md#architecture), [code](docs/contributing.md#command-line), [entity](docs/contributing.md#html--entity), [emoji](docs/contributing.md#emoji-), [Japanese](docs/contributing.md#日本語-ガイド), [HTML text](docs/contributing.md#rich-heading), [duplicate](docs/contributing.md#duplicate-1).

[Home](https://example.test)
<https://example.test/reference>
www.example.test/autolink
<person@example.test>

![architecture](assets/architecture-diagram.png)
[ignored but existing asset](assets/private.png)
[docs folder](docs/)

[missing guide](docs/not-present.md)

Use `[an example](does-not-exist-in-code.md)` in a code span.

```md
[an example](does-not-exist-in-fence.md)
```

<a href="does-not-exist-in-html.md">HTML is outside scope</a>

| Topic       | Link                                                  |
| ----------- | ----------------------------------------------------- |
| Agent notes | [.agents guide](.agents/AGENTS.md#agent-instructions) |
