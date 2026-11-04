import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isVercelPreviewHostname,
  isFrontendPreview,
  validatePreviewApiUrl,
  resolveApiBaseUrl
} from '../../client/src/services/apiConfig.js';

describe('Hirevoxa Frontend API Configuration & Preview Fail-Closed Guard', () => {

  test('1. isVercelPreviewHostname correctly identifies Preview hostnames and excludes production', () => {
    // Vercel Preview domains
    assert.equal(isVercelPreviewHostname('hirevoxa-git-test-himmatchouhan50-6334.vercel.app'), true);
    assert.equal(isVercelPreviewHostname('hirevoxa-preview-abc123.vercel.app'), true);
    assert.equal(isVercelPreviewHostname('hirevoxa-staging.vercel.app'), true);

    // Canonical production domain must NOT be treated as Preview
    assert.equal(isVercelPreviewHostname('hirevoxa.vercel.app'), false);

    // Custom production and local hostnames
    assert.equal(isVercelPreviewHostname('hirevoxa.com'), false);
    assert.equal(isVercelPreviewHostname('www.hirevoxa.com'), false);
    assert.equal(isVercelPreviewHostname('localhost'), false);
    assert.equal(isVercelPreviewHostname('127.0.0.1'), false);
    assert.equal(isVercelPreviewHostname(''), false);
    assert.equal(isVercelPreviewHostname(null), false);
  });

  test('2. isFrontendPreview identifies preview via build env or runtime hostname', () => {
    assert.equal(isFrontendPreview({ VITE_VERCEL_ENV: 'preview' }, 'localhost'), true);
    assert.equal(isFrontendPreview({}, 'hirevoxa-git-branch-team.vercel.app'), true);
    assert.equal(isFrontendPreview({ VITE_VERCEL_ENV: 'production' }, 'hirevoxa.vercel.app'), false);
    assert.equal(isFrontendPreview({}, 'localhost'), false);
  });

  test('3. Preview frontend without VITE_API_BASE_URL fails closed and does not call Production or localhost', () => {
    const previewHostname = 'hirevoxa-git-preview-himmatchouhan50-6334.vercel.app';

    // Completely unset
    assert.throws(
      () => resolveApiBaseUrl({}, previewHostname),
      (err) => {
        assert.match(err.message, /\[Hirevoxa Config Error\] Preview deployment missing required VITE_API_BASE_URL/);
        assert.match(err.message, /explicit HTTPS backend URL is required to prevent accidental calls to the Production API/);
        return true;
      }
    );

    // Empty string
    assert.throws(
      () => resolveApiBaseUrl({ VITE_API_BASE_URL: '' }, previewHostname),
      (err) => {
        assert.match(err.message, /\[Hirevoxa Config Error\] Preview deployment missing required VITE_API_BASE_URL/);
        return true;
      }
    );

    // Whitespace only
    assert.throws(
      () => resolveApiBaseUrl({ VITE_API_BASE_URL: '   ' }, previewHostname),
      (err) => {
        assert.match(err.message, /\[Hirevoxa Config Error\] Preview deployment missing required VITE_API_BASE_URL/);
        return true;
      }
    );
  });

  test('4. Preview frontend with insecure HTTP URL is rejected with HTTPS requirement error', () => {
    const previewHostname = 'hirevoxa-git-preview-himmatchouhan50-6334.vercel.app';

    assert.throws(
      () => resolveApiBaseUrl({ VITE_API_BASE_URL: 'http://insecure-backend.vercel.app/api' }, previewHostname),
      (err) => {
        assert.match(err.message, /\[Hirevoxa Config Error\] Invalid VITE_API_BASE_URL/);
        assert.match(err.message, /Preview API URL must use secure HTTPS protocol/);
        return true;
      }
    );
  });

  test('5. Preview frontend configured to point to Production backend is strictly blocked', () => {
    const previewHostname = 'hirevoxa-git-preview-himmatchouhan50-6334.vercel.app';

    assert.throws(
      () => resolveApiBaseUrl({ VITE_API_BASE_URL: 'https://hirevoxa-server.vercel.app/api' }, previewHostname),
      (err) => {
        assert.match(err.message, /Preview VITE_API_BASE_URL cannot point to the Production backend/);
        assert.match(err.message, /Preview environments must point to an isolated Preview backend/);
        return true;
      }
    );
  });

  test('6. Preview frontend with valid HTTPS Preview API URL uses that URL and normalizes trailing slashes', () => {
    const previewHostname = 'hirevoxa-git-preview-himmatchouhan50-6334.vercel.app';
    const validPreviewUrl = 'https://hirevoxa-server-git-preview-himmatchouhan50-6334.vercel.app/api///';

    const resolved = resolveApiBaseUrl({ VITE_API_BASE_URL: validPreviewUrl }, previewHostname);
    assert.equal(resolved, 'https://hirevoxa-server-git-preview-himmatchouhan50-6334.vercel.app/api');
  });

  test('7. Production continues to use its existing intended configuration', () => {
    // Canonical production domain on Vercel without override
    const prodVercel = resolveApiBaseUrl({}, 'hirevoxa.vercel.app');
    assert.equal(prodVercel, 'https://hirevoxa-server.vercel.app/api');

    // Canonical custom production domain
    const prodCustom = resolveApiBaseUrl({}, 'hirevoxa.com');
    assert.equal(prodCustom, 'https://hirevoxa-server.vercel.app/api');

    // Production with explicit override
    const prodOverride = resolveApiBaseUrl({ VITE_API_BASE_URL: 'https://api.hirevoxa.com/v1' }, 'hirevoxa.com');
    assert.equal(prodOverride, 'https://api.hirevoxa.com/v1');
  });

  test('8. Local development continues to work seamlessly', () => {
    // localhost default
    const localDefault = resolveApiBaseUrl({}, 'localhost');
    assert.equal(localDefault, 'http://localhost:5000/api');

    // 127.0.0.1 default
    const loopbackDefault = resolveApiBaseUrl({}, '127.0.0.1');
    assert.equal(loopbackDefault, 'http://localhost:5000/api');

    // Local custom override (e.g. testing local server on another port)
    const localCustom = resolveApiBaseUrl({ VITE_API_BASE_URL: 'http://localhost:5001/api' }, 'localhost');
    assert.equal(localCustom, 'http://localhost:5001/api');
  });
});
