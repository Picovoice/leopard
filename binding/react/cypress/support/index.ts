import './commands';

declare global {
  namespace Cypress {
    interface Chainable {
      wrapHook(fn: () => Promise<any>): Chainable<void>;
      getFramesFromFile(path: string): Chainable<Int16Array>;
      mockRecording(path: string, delayMs?: number): Chainable<void>;
    }
  }
}
