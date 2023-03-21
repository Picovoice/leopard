declare module "*.wasm" {
  const content: string;
  export default content;
}

declare module 'web-worker:*.ts' {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}

/// <reference types="vite/client" />
