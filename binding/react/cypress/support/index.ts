import './commands';

declare global {
  namespace Cypress {
    interface Chainable {
      wrapHook(fn: () => Promise<any>): Chainable<void>;
      getFileObj(path: string): Chainable<File>;
      mockRecording(path: string): Chainable<void>;
    }
  }
}
