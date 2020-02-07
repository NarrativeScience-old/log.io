import express from 'express'
import http from 'http'
import net from 'net'
import path from 'path'
import socketio from 'socket.io'
import InputRegistry from './inputs'
import { MessageHandlers, ServerConfig } from './types'

// File path to UI app build artifacts (static JS/CSS/HTML)
const UI_BUILD_PATH = process.env.LOGIO_SERVER_UI_BUILD_PATH
  || path.resolve(__dirname, 'ui')

/**
 * Broadcast an inbound message to socket.io channels
 */
async function handleNewMessage(
  config: ServerConfig,
  inputs: InputRegistry,
  io: SocketIO.Server,
  msgParts: Array<string>,
): Promise<void> {
  const [mtype, stream, source] = msgParts.slice(0, 3)
  const msg = msgParts.slice(3).join('|')
  const inputName = inputs.add(stream, source)
  // Broadcast message to input channel
  io.to(inputName).emit(mtype, { inputName, msg, stream, source })
  // Broadcast ping to all browsers
  io.emit('+ping', { inputName, stream, source })
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log(msgParts.join('|'))
  }
}

/**
 * Broadcast a new input coming online to all browsers
 */
async function handleRegisterInput(
  config: ServerConfig,
  inputs: InputRegistry,
  io: SocketIO.Server,
  msgParts: Array<string>,
): Promise<void> {
  const [mtype, stream, source] = msgParts.slice(0, 3)
  const inputName = inputs.add(stream, source)
  io.emit(mtype, { stream, source, inputName })
}

/**
 * Broadcast an input going offline to all browsers
 */
async function handleDeregisterInput(
  config: ServerConfig,
  inputs: InputRegistry,
  io: SocketIO.Server,
  msgParts: Array<string>,
): Promise<void> {
  const [mtype, stream, source] = msgParts.slice(0, 3)
  const inputName = inputs.remove(stream, source)
  io.emit(mtype, { stream, source, inputName })
}

// Maps TCP message prefix to handler function
const messageHandlers: MessageHandlers = {
  '+msg': handleNewMessage,
  '+input': handleRegisterInput,
  '-input': handleDeregisterInput,
}

/**
 * Broadcast an inbound message to socket.io channels
 */
async function broadcastMessage(
  config: ServerConfig,
  inputs: InputRegistry,
  io: SocketIO.Server,
  data: Buffer,
): Promise<void> {
  // Parse raw message into parts
  const msgs = data.toString().split('\0')
  // Ignore messages that don't contain null termination character
  if (msgs.length === 1) { return }
  const validMsgs = msgs.filter(msg => !!msg.trim())
  validMsgs.forEach(async (msg) => {
    const msgParts = msg.split('|')
    const messageHandler = messageHandlers[msgParts[0]]
    if (messageHandler) {
      await messageHandler(config, inputs, io, msgParts)
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unknown message type: ${msgParts[0]}`)
    }
  })
}

/**
 * Start message & web servers
 */
async function main(config: ServerConfig): Promise<void> {
  // Create HTTP server w/ static file serving & socket.io bindings
  const server = express()
  server.use('/', express.static(UI_BUILD_PATH))
  const httpServer = new http.Server(server)
  const io = socketio(httpServer)
  const inputs = new InputRegistry()

  // Create TCP message server
  const messageServer = net.createServer(async (socket: net.Socket) => {
    socket.on('data', async (data: Buffer) => {
      await broadcastMessage(config, inputs, io, data)
    })
  })

  // When a new browser connects, register stream activation events
  io.on('connection', async (socket: SocketIO.Socket) => {
    // Send existing inputs to browser
    inputs.getInputs().forEach((input) => {
      socket.emit('+input', input)
    })
    // Register input activation events
    socket.on('+activate', (inputName) => {
      socket.join(inputName)
    })
    socket.on('-activate', (inputName) => {
      socket.leave(inputName)
    })
  })

  // Start listening for requests
  messageServer.listen(config.messageServer.port, config.messageServer.host, () => {
    // eslint-disable-next-line no-console
    console.log(`TCP message server listening on port ${config.messageServer.port}`)
  })
  httpServer.listen(config.httpServer.port, config.httpServer.host, () => {
    // eslint-disable-next-line no-console
    console.log(`HTTP server listening on port ${config.httpServer.port}`)
  })
}

export default main
