/**
 * Get string name of provided input
 */
export function getInputName(
  streamName: string,
  sourceName: string,
): string {
  return `${streamName}|${sourceName}`
}

/**
 * Maintains list of registered inputs
 */
class InputRegistry {
  inputs: { [inputName: string]: boolean }

  constructor() {
    this.inputs = {}
  }

  add(streamName: string, sourceName: string): string {
    const inputName = getInputName(streamName, sourceName)
    this.inputs[inputName] = true
    return inputName
  }

  remove(streamName: string, sourceName: string): string {
    const inputName = getInputName(streamName, sourceName)
    delete this.inputs[inputName]
    return inputName
  }

  getInputs(): Array<{ stream: string, source: string, inputName: string }> {
    return Object.keys(this.inputs).map((inputName) => {
      const [stream, source] = inputName.split('|')
      return { stream, source, inputName }
    })
  }
}

export default InputRegistry
