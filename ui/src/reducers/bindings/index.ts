import produce from 'immer'

import { BindingActions, BindingState, BindingActionTypes } from './types'
import { InputActions, InputState } from '../inputs/types'
import { ScreenActions } from '../screens/types'

export const initialBindingState: BindingState = {
  inputs: {},
  screens: {},
  sources: {},
  streams: {},
}

/**
 * Helper method to update state when an input is bound
 */
const bindInputToScreen = (
  bindings: BindingState,
  inputName: string,
  screenId: string
) => {
  if (!bindings.inputs[inputName]) {
    bindings.inputs[inputName] = {}
  }
  if (!bindings.screens[screenId]) {
    bindings.screens[screenId] = {
      inputs: {},
      streams: {},
      sources: {},
    }
  }
  bindings.inputs[inputName][screenId] = true
  bindings.screens[screenId].inputs[inputName] = true
}

/**
 * Helper method to update state when an input is unbound
 */
const unbindInputFromScreen = (
  bindings: BindingState,
  inputName: string,
  screenId: string
) => {
  const { inputs, screens } = bindings
  if (inputs[inputName]) {
    delete inputs[inputName][screenId]
  }
  if (screens[screenId]) {
    delete screens[screenId].inputs[inputName]
  }
}

/**
 * Helper method to bind stream to screen if all stream inputs are bound
 */
const checkStreamBinding = (
  state: BindingState,
  inputs: InputState,
  source: string,
  stream: string,
  screenId: string,
) => {
  const allStreamInputsBound = Object.keys(inputs.streams[stream].pairs).map((source) => (
    inputs.streams[stream].pairs[source]
  )).every((inputName) => (state.inputs[inputName] || {})[screenId])
  if (allStreamInputsBound) {
    if (!state.streams[stream]) {
      state.streams[stream] = {}
    }
    state.streams[stream][screenId] = true
  }
}

/**
 * Helper method to bind source to screen if all source inputs are bound
 */
const checkSourceBinding = (
  state: BindingState,
  inputs: InputState,
  source: string,
  stream: string,
  screenId: string,
) => {
  const allSourceInputsBound = Object.keys(inputs.sources[source].pairs).map((stream) => (
    inputs.sources[source].pairs[stream]
  )).every((inputName) => (state.inputs[inputName] || {})[screenId])
  if (allSourceInputsBound) {
    if (!state.sources[source]) {
      state.sources[source] = {}
    }
    state.sources[source][screenId] = true
  }
}

/**
 * Manages application state for screen/input bindings
 */
export const BindingReducer = produce((
  state: BindingState,
  inputs: InputState,
  action: BindingActionTypes
) => {
  switch (action.type) {

    // Start displaying input messages on a screen
    case BindingActions.BIND_INPUT_TO_SCREEN: {
      const { inputName, screenId, source, stream } = action
      bindInputToScreen(state, inputName, screenId)
      checkStreamBinding(state, inputs, source, stream, screenId)
      checkSourceBinding(state, inputs, source, stream, screenId)
      break
    }

    // Stop displaying input messages on a screen
    case BindingActions.UNBIND_INPUT_FROM_SCREEN: {
      const { inputName, screenId, source, stream } = action
      unbindInputFromScreen(state, inputName, screenId)
      if (state.streams[stream]) {
        delete state.streams[stream][screenId]
      }
      if (state.sources[source]) {
        delete state.sources[source][screenId]
      }
      break
    }

    // Start display messages for all stream inputs on a screen
    case BindingActions.BIND_STREAM_TO_SCREEN: {
      const { stream, screenId } = action
      const { pairs } = inputs.streams[stream]
      Object.keys(pairs).forEach((source) => {
        bindInputToScreen(state, pairs[source], screenId)
        checkSourceBinding(state, inputs, source, stream, screenId)
      })
      if (!state.streams[stream]) {
        state.streams[stream] = {}
      }
      state.streams[stream][screenId] = true
      break
    }

    // Stop displaying messages for all stream inputs on a screen
    case BindingActions.UNBIND_STREAM_FROM_SCREEN: {
      const { stream, screenId } = action
      const { pairs } = inputs.streams[stream]
      Object.keys(pairs).forEach((source) => {
        unbindInputFromScreen(state, pairs[source], screenId)
        if (state.sources[source]) {
          delete state.sources[source][screenId]
        }
      })
      if (state.streams[stream]) {
        delete state.streams[stream][screenId]
      }
      break
    }

    // Start display messages for all source inputs on a screen
    case BindingActions.BIND_SOURCE_TO_SCREEN: {
      const { source, screenId } = action
      const { pairs } = inputs.sources[source]
      Object.keys(pairs).forEach((stream) => {
        bindInputToScreen(state, pairs[stream], screenId)
        checkStreamBinding(state, inputs, source, stream, screenId)
      })
      if (!state.sources[source]) {
        state.sources[source] = {}
      }
      state.sources[source][screenId] = true
      break
    }

    // Stop displaying messages for all source inputs on a screen
    case BindingActions.UNBIND_SOURCE_FROM_SCREEN: {
      const { source, screenId } = action
      const { pairs } = inputs.sources[source]
      Object.keys(pairs).forEach((stream) => {
        unbindInputFromScreen(state, pairs[stream], screenId)
        if (state.streams[stream]) {
          delete state.streams[stream][screenId]
        }
      })
      if (state.sources[source]) {
        delete state.sources[source][screenId]
      }
      break
    }

    // Clean up bindings when a screen is removed
    case ScreenActions.REMOVE_SCREEN: {
      const { screenId } = action
      const screenBindings = state.screens[screenId] || {}
      // Clean up input bindings
      Object.keys(screenBindings.inputs || {}).forEach((inputName) => {
        if (state.inputs[inputName]) {
          delete state.inputs[inputName][screenId]
        }
      })
      // Clean up stream bindings
      Object.keys(screenBindings.streams || {}).forEach((stream) => {
        if (state.streams[stream]) {
          delete state.streams[stream][screenId]
        }
      })
      // Clean up source bindings
      Object.keys(screenBindings.sources || {}).forEach((source) => {
        if (state.sources[source]) {
          delete state.sources[source][screenId]
        }
      })
      delete state.screens[screenId]
      break
    }

    // Delete associated stream & source screen bindings when a new input arrives
    case InputActions.ENSURE_INPUT: {
      const { inputName, stream, source } = action
      if (state.sources[source] && !inputs.inputs[inputName]) {
        Object.keys(state.sources[source]).forEach((screenId) => {
          delete state.sources[source][screenId]
        })
      }
      if (state.streams[stream] && !inputs.inputs[inputName]) {
        Object.keys(state.streams[stream]).forEach((screenId) => {
          delete state.streams[stream][screenId]
        })
      }
      break
    }
  }
})

export default BindingReducer
