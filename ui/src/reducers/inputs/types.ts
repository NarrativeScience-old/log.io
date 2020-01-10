export const InputActions = {
  ENSURE_INPUT: 'ENSURE_INPUT' as 'ENSURE_INPUT',
  PING: 'PING' as 'PING',
  REMOVE_INPUT: 'REMOVE_INPUT' as 'REMOVE_INPUT',
}

export type Input = {
  name: string,
  stream: string,
  source: string,
  ping: number | null,
}

export type Pairs = {
  pairs: { [sourceName: string]: string },
  ping: number | null,
}

export type InputState = {
  inputs: { [inputName: string]: Input },
  streams: { [streamName: string]: Pairs },
  sources: { [sourceName: string]: Pairs },
}

export type EnsureInputAction = {
  type: typeof InputActions.ENSURE_INPUT,
  inputName: string,
  stream: string,
  source: string,
}

export type RemoveInputAction = {
  type: typeof InputActions.REMOVE_INPUT,
  inputName: string,
  stream: string,
  source: string,
}

export type PingAction = {
  type: typeof InputActions.PING,
  inputName: string,
  stream: string,
  source: string,
}

export type InputActionTypes = EnsureInputAction | PingAction | RemoveInputAction
