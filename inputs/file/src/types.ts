export type FileSizeMap = { [path: string]: number }

export type FileInputConfig = {
  source: string,
  stream: string,
  config: {
    path: string,
    watcherOptions: any,
  },
}

export type InputConfig = {
  messageServer: {
    host: string,
    port: number,
  },
  inputs: Array<FileInputConfig>,
}

export type WatchedPathsMap = {
  [path: string]: Array<string>
}