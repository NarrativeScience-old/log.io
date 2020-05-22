import InputRegistry from './inputs'

export type ServerConfig = {
  messageServer: {
    port: number,
    host: string
  },
  httpServer: {
    port: number,
    host: string
  },
  debug?: boolean,
  basicAuth?: {
    realm: string,
    users: {
      [username: string]: string,
    }
  },
}

export type MessageHandlerFunction = (
  config: ServerConfig,
  inputs: InputRegistry,
  io: SocketIO.Server,
  msgParts: Array<string>
) => Promise<void>

export type MessageHandlers = {
  [messageType: string]: MessageHandlerFunction,
}
