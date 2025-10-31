// setup-jest.ts
import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

beforeAll(() => {
  try {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
      teardown: { destroyAfterEach: true }
    });
  } catch (e) {
    // ignore if already initialized
  }
});

// Optional: silence Angular animations during tests if needed
// (Material often depends on animations; noop is fine for unit tests)
// You can configure TestBed in each spec as needed.
