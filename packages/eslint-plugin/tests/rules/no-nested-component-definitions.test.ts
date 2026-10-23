import { RuleTester } from './rule-tester.js'

import rule from '../../src/rules/no-nested-component-definitions.js'

new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
}).run('no-nested-component-definitions', rule as never, {
  valid: [
    'const Toggle = () => <button />;',
    'function Dialog() { return <div role="dialog" />; }',
    'function Parent() { const renderItem = () => <li />; return <ul>{renderItem()}</ul>; }',
    "function Parent() { function ParseDate(value) { return new Date(value); } return ParseDate('2026-01-01'); }",
    'function Parent() { function BuildLabel() { const render = () => <span />; return null; } return BuildLabel(); }',
    // Higher-order components build their inner component once per call, not
    // once per render, so the factory itself is not a component.
    'function withRouter(Wrapped) { const WithRouter = (props) => <Wrapped {...props} />; return WithRouter; }',
    'const withTheme = (Wrapped) => { const WithTheme = (props) => <Wrapped {...props} />; return WithTheme; };',
    'function createCard() { const Card = () => <div />; return Card; }',
    // Only `React.memo` counts; an unrelated `memo` member call does not.
    'function makeCard() { const Card = cache.memo(() => <div />); return Card; }',
  ],
  invalid: [
    {
      code: 'function Parent() { const InnerCard = () => <div />; return <InnerCard />; }',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: 'const Parent = () => { function Dialog() { return <div />; } return <Dialog />; };',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: 'function Parent() { const Row = function() { return <tr />; }; return <Row />; }',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: 'function Parent() { const InnerCard = React.memo(() => <div />); return <InnerCard />; }',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: 'function Parent() { const InnerCard = forwardRef(function InnerCard() { return <div />; }); return <InnerCard />; }',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: 'function Parent() { const InnerCard = memo(() => null); return <InnerCard />; }',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: "function Parent() { function InnerCard() { return React.createElement('div'); } return <InnerCard />; }",
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: 'function Parent() { let InnerCard; InnerCard = () => <div />; return <InnerCard />; }',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    // Hooks re-run on every render of their caller, so they recreate a nested
    // component's identity just as a component body would.
    {
      code: 'function useCard() { const Card = () => <div />; return Card; }',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
    {
      code: 'const useRow = () => { const Row = () => <tr />; return Row; };',
      errors: [{ messageId: 'noNestedComponentDefinition' }],
    },
  ],
})
