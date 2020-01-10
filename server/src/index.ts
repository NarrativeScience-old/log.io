import fs from 'fs'
import os from 'os'
import path from 'path'
import server from './server'
import { ServerConfig } from './types'

// Check for ~/.log.io/server.json
const homedirConfigPath = path.resolve(os.homedir(), '.log.io/server.json')
const homedirConfigPathExists = fs.existsSync(homedirConfigPath)

const CONFIG_PATH = process.env.LOGIO_SERVER_CONFIG_PATH
  || (homedirConfigPathExists && homedirConfigPath)
  || path.resolve(__dirname, '../config.json')

function loadConfig(configPath: string): ServerConfig {
  return JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }))
}

(async (): Promise<void> => {
  const config = await loadConfig(CONFIG_PATH)
  await server(config)
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
})
