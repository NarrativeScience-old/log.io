import produce from 'immer'

import { ScreenActions, ScreenState, ScreenActionTypes } from './types'

export const initialScreenState: ScreenState = {
  screens: {},
}

function generateScreenId(): string {
  return String(new Date().valueOf())
}

/**
 * Manages application state for screens
 */
export const ScreenReducer = produce((
  state: ScreenState,
  action: ScreenActionTypes
) => {
  const { screens } = state
  switch (action.type) {
    // Create a new screen
    case ScreenActions.ADD_SCREEN: {
      const screenId = action.screenId || generateScreenId()
      screens[screenId] = {
        id: screenId,
        messages: [],
      }
      break
    }
    // Remove an existing screen
    case ScreenActions.REMOVE_SCREEN: {
      const { screenId } = action
      if (screenId) {
        delete screens[screenId]
      }
      break
    }
  }
})

export default ScreenReducer
