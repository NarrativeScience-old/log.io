export const ScreenActions = {
  ADD_SCREEN: 'ADD_SCREEN' as 'ADD_SCREEN',
  REMOVE_SCREEN: 'REMOVE_SCREEN' as 'REMOVE_SCREEN',
}

export type Screen = {
  id: string,
  messages: Array<string>,
}

export type ScreenState = {
  screens: { [screenId: string]: Screen },
}

export type AddScreenAction = {
  type: typeof ScreenActions.ADD_SCREEN,
  screenId?: string,
}

export type RemoveScreenAction = {
  type: typeof ScreenActions.REMOVE_SCREEN,
  screenId: string,
}

export type ScreenActionTypes = AddScreenAction | RemoveScreenAction
