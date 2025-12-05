import { DataLoader as DataLoaderBase } from 'dataloader'
declare module 'dataloader' {
  export namespace DataLoader {
    export interface Options<K, V, C = K> {
      name: string
    }
  }

  export = DataLoaderBase
}
