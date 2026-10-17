import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isDesignPreview} from '../app/lib/designPreview.ts';

test('local collection browsing retains preview without requiring query parameters', () => {
  assert.equal(isDesignPreview(new Request('http://localhost:3017/collections/all')), true);
  assert.equal(isDesignPreview(new Request('http://127.0.0.1:3017/collections')), true);
});

test('a deployed storefront never enables preview implicitly', () => {
  assert.equal(isDesignPreview(new Request('https://thread77.example/collections/all')), false);
  assert.equal(isDesignPreview(new Request('https://thread77.example/collections/all?preview=1')), true);
});

test('explicit exit overrides local preview and malformed flags do not enable it', () => {
  assert.equal(isDesignPreview(new Request('http://localhost:3017/collections/all?preview=0')), false);
  assert.equal(isDesignPreview(new Request('https://thread77.example/?preview=yes')), false);
});
