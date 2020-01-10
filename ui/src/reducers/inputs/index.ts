import produce from 'immer'

import { InputActions, InputState, InputActionTypes } from './types'

export const initialInputState: InputState = {
  inputs: {},
  streams: {},
  sources: {},
}

/**
 * Manages application state for message inputs
 */
export const InputReducer = produce((
  state: InputState,
  action: InputActionTypes
) => {
  const { inputs, streams, sources } = state
  switch (action.type) {
    // Server sent a new message
    case InputActions.PING: {
      const { inputName, stream, source } = action
      const pingTime = new Date().getTime()
      inputs[inputName].ping = pingTime
      streams[stream].ping = pingTime
      sources[source].ping = pingTime
      break
    }

    // Initialize state for the provided input, if necessary
    case InputActions.ENSURE_INPUT: {
      const { inputName, stream, source } = action
      if (!inputs[inputName]) {
        inputs[inputName] = {
          name: inputName,
          ping: null,
          stream,
          source,
        }
        if (!streams[stream]) {
          streams[stream] = {
            ping: null,
            pairs: {},
          }
        }
        if (!sources[source]) {
          sources[source] = {
            ping: null,
            pairs: {},
          }
        }
        streams[stream].pairs[source] = inputName
        sources[source].pairs[stream] = inputName
      }
      break
    }
    // Remove an input from state
    case InputActions.REMOVE_INPUT: {
      const { inputName, stream, source } = action
      delete streams[stream].pairs[source]
      delete sources[source].pairs[stream]
      delete inputs[inputName]
      break
    }
  }
})

export default InputReducer

