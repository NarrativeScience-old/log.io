import { ScreenActionTypes } from '../screens/types'
import { EnsureInputAction } from '../inputs/types'

export const BindingActions = {
  BIND_INPUT_TO_SCREEN: 'BIND_INPUT_TO_SCREEN' as 'BIND_INPUT_TO_SCREEN',
  BIND_SOURCE_TO_SCREEN: 'BIND_SOURCE_TO_SCREEN' as 'BIND_SOURCE_TO_SCREEN',
  BIND_STREAM_TO_SCREEN: 'BIND_STREAM_TO_SCREEN' as 'BIND_STREAM_TO_SCREEN',
  UNBIND_INPUT_FROM_SCREEN: 'UNBIND_INPUT_FROM_SCREEN' as 'UNBIND_INPUT_FROM_SCREEN',
  UNBIND_SOURCE_FROM_SCREEN: 'UNBIND_SOURCE_FROM_SCREEN' as 'UNBIND_SOURCE_FROM_SCREEN',
  UNBIND_STREAM_FROM_SCREEN: 'UNBIND_STREAM_FROM_SCREEN' as 'UNBIND_STREAM_FROM_SCREEN',
}

export type BindingState = {
  inputs: { [inputName: string]: { [screenId: string]: boolean } },
  screens: {
    [screenId: string]: {
      inputs: { [inputName: string]: boolean },
      streams: { [streamName: string ]: boolean },
      sources: { [sourceName: string ]: boolean },
    },
  },
  sources: { [sourceName: string]: { [screenId: string]: boolean } },
  streams: { [streamName: string]: { [screenId: string]: boolean } },

}

export type BindInputToScreenAction = {
  type: typeof BindingActions.BIND_INPUT_TO_SCREEN,
  inputName: string,
  stream: string,
  source: string,
  screenId: string,
}

export type UnbindInputFromScreenAction = {
  type: typeof BindingActions.UNBIND_INPUT_FROM_SCREEN,
  inputName: string,
  stream: string,
  source: string,
  screenId: string,
}

export type BindSourceToScreenAction = {
  type: typeof BindingActions.BIND_SOURCE_TO_SCREEN,
  source: string,
  screenId: string,
}

export type UnbindSourceFromScreenAction = {
  type: typeof BindingActions.UNBIND_SOURCE_FROM_SCREEN,
  source: string,
  screenId: string,
}

export type BindStreamToScreenAction = {
  type: typeof BindingActions.BIND_STREAM_TO_SCREEN,
  stream: string,
  screenId: string,
}

export type UnbindStreamFromScreenAction = {
  type: typeof BindingActions.UNBIND_STREAM_FROM_SCREEN,
  stream: string,
  screenId: string,
}

export type BindingActionTypes = BindInputToScreenAction
  | BindSourceToScreenAction
  | BindStreamToScreenAction
  | UnbindInputFromScreenAction
  | UnbindSourceFromScreenAction
  | UnbindStreamFromScreenAction
  | ScreenActionTypes
  | EnsureInputAction