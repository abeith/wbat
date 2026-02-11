# WBAT unit tests

This folder contains deterministic tests for logic that can run without microphone permissions, browser interaction, or real `AudioContext` runtime behavior.

## Scope

- Validate data-shape and argument guards.
- Verify pure numeric/array transformations.
- Test helper methods with stable inputs.

## Non-goals

- Testing real device input/output behavior.
- Testing browser permission prompts.
- Testing full end-to-end playback/capture timing.

## Mocks policy

- Use lightweight mocks only at external boundaries.
- Do not mock internal logic under test.
- Keep tests readable and focused on behavior, not implementation details.

## Run

`npm run test:unit -w packages/wbat`
