export type FileSizeMap = { [path: string]: number }

export type WatcherOptions = {
  persistent: boolean,
  ignored: string,
  ignoreInitial: boolean,
  followSymlinks: boolean,
  cwd: string,
  disableGlobbing: boolean,
  usePolling: boolean,
  interval: number,
  binaryInterval: number,
  alwaysStat: boolean,
  depth: number,
  awaitWriteFinish: {
    stabilityThreshold: number,
    pollInterval: number
  },
  ignorePermissionErrors: boolean,
  atomic: boolean | number
}

export type FileInputConfig = {
  source: string,
  stream: string,
  config: {
    path: string,
    watcherOptions: WatcherOptions,
  },
}

export type InputConfig = {
  messageServer: {
    host: string,
    port: number,
  },
  inputs: Array<FileInputConfig>,
}
