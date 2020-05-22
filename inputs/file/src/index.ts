import fs from 'fs'
import os from 'os'
import path from 'path'
import fileInput from './input'
import { FileInputConfig, InputConfig } from './types'

// Check for ~/.log.io/inputs/file.json
const homedirConfigPath = path.resolve(os.homedir(), '.log.io/inputs/file.json')
const homedirConfigPathExists = fs.existsSync(homedirConfigPath)

// Optional root file path to calculate input file paths
const ROOT_PATH = process.env.LOGIO_FILE_INPUT_ROOT_PATH
const CONFIG_PATH = process.env.LOGIO_FILE_INPUT_CONFIG_PATH
  || (homedirConfigPathExists && homedirConfigPath)

// Abort if no configuration file is found
if (!CONFIG_PATH) {
  // eslint-disable-next-line no-console
  console.error(`
ERROR: Unable to find a configuration file.

Create a configuration file at ~/.log.io/inputs/file.json,
or specify a custom path via an environment variable: LOGIO_FILE_INPUT_CONFIG_PATH.

See README for configuration examples.
  `)
  process.exit(1)
}

function loadConfig(configPath: string): InputConfig {
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }))
  if (ROOT_PATH) {
    config.inputs.forEach((input: FileInputConfig) => {
      // eslint-disable-next-line no-param-reassign
      input.config.path = path.resolve(ROOT_PATH, input.config.path)
    })
  }
  return config
}

(async (): Promise<void> => {
  const config = loadConfig(CONFIG_PATH)
  await fileInput(config)
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
})
