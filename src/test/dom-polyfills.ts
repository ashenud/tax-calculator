/**
 * Browser APIs that jsdom does not implement, stubbed for the component tests.
 *
 * Radix's floating primitives (`Select`) measure and position their content,
 * which means `ResizeObserver`, pointer capture and `scrollIntoView` — none of
 * which jsdom has. Without these the component throws on open and the test
 * suite ends up asserting nothing about the case it was written for.
 *
 * These are stubs, not implementations. **They are why the touch-target check
 * cannot be a `getBoundingClientRect` measurement**: jsdom performs no layout,
 * so every box it reports is 0×0 whatever the CSS says. That check therefore
 * resolves the real cascade instead — see `touch-target.test.tsx`, which is
 * explicit about what it does and does not prove.
 *
 * Not shipped. Test-only, imported by the `.test.tsx` files that need it.
 */

export function installDomPolyfills(): void {
  if (typeof window === 'undefined') return;

  if (!('ResizeObserver' in window)) {
    class ResizeObserverStub {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      configurable: true,
      value: ResizeObserverStub,
    });
  }

  if (!('DOMRect' in window)) {
    Object.defineProperty(window, 'DOMRect', {
      writable: true,
      configurable: true,
      value: class DOMRectStub {
        constructor(
          public x = 0,
          public y = 0,
          public width = 0,
          public height = 0,
        ) {}
        get top() {
          return this.y;
        }
        get left() {
          return this.x;
        }
        get right() {
          return this.x + this.width;
        }
        get bottom() {
          return this.y + this.height;
        }
        static fromRect() {
          return new DOMRectStub();
        }
        toJSON() {
          return {};
        }
      },
    });
  }

  const proto = window.Element.prototype as unknown as Record<string, unknown>;
  if (!proto['hasPointerCapture']) proto['hasPointerCapture'] = () => false;
  if (!proto['setPointerCapture']) proto['setPointerCapture'] = () => {};
  if (!proto['releasePointerCapture']) proto['releasePointerCapture'] = () => {};
  if (!proto['scrollIntoView']) proto['scrollIntoView'] = () => {};

  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
}
