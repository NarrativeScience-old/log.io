import InputRegistry from './inputs'

export type ServerConfig = {
  debug?: boolean,
  messageServer: {
    port: number,
    host: string
  },
  httpServer: {
    port: number,
    host: string
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
