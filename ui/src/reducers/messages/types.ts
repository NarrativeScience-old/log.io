export const MessageActions = {
  ADD_MESSAGE: 'ADD_MESSAGE' as 'ADD_MESSAGE',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES' as 'CLEAR_MESSAGES',
}

export type MessageState = {
  screens: { [screenId: string]: Array<string> },
}

export type AddMessageAction = {
  type: typeof MessageActions.ADD_MESSAGE,
  inputName: string,
  msg: string,
}

export type ClearMessagesAction = {
  type: typeof MessageActions.CLEAR_MESSAGES,
  screenId: string,
}

export type MessageActionTypes = AddMessageAction | ClearMessagesAction
