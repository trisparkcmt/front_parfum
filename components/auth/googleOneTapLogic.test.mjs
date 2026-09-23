import test from 'node:test';
import assert from 'node:assert/strict';
import { getRetryDelayMs, shouldRetryGoogleOneTapPrompt, isMobileBrowser } from './googleOneTapLogic.js';

test('mobile browser gets a delayed retry window', () => {
  assert.equal(isMobileBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), true);
  assert.equal(getRetryDelayMs('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), 1800);
  assert.equal(shouldRetryGoogleOneTapPrompt('suppressed_by_user', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 1), true);
  assert.equal(shouldRetryGoogleOneTapPrompt('invalid_client', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1), false);
});
