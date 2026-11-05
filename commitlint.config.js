/**
 * Conventional Commits enforcement.
 * Format: type(scope): description
 * Docs: docs/CONTRIBUTING.md
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'perf',
        'docs',
        'test',
        'build',
        'ci',
        'chore',
        'style',
        'revert',
      ],
    ],
    'scope-enum': [
      1,
      'always',
      [
        'domain',
        'map',
        'scanner',
        'admin',
        'ui',
        'data',
        'schedule',
        'events',
        'qr',
        'tools',
        'qa',
        'deps',
        'docs',
        'ci',
        'release',
      ],
    ],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
}
