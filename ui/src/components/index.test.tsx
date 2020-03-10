import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import App from './app/index'
import { initializeState } from '../reducers'

const mockSocket = () => {
  const callbacks = {}
  const mockEmit = jest.fn()
  return {
    on: (eventName, callback) => {
      if (!callbacks[eventName]) {
        callbacks[eventName] = []
      }
      callbacks[eventName].push(callback)
    },
    trigger: (eventName, data) => {
      (callbacks[eventName] || []).forEach((callback) => { callback(data) })
    },
    emit: mockEmit,
  }
}

const socket = mockSocket()
const initialTestState = initializeState(socket)
const testInputs = [
  {
    inputName: 'app1|server1',
    stream: 'app1',
    source: 'server1',
  },
  {
    inputName: 'app1|server2',
    stream: 'app1',
    source: 'server2',
  },
  {
    inputName: 'app2|server1',
    stream: 'app2',
    source: 'server1',
  },
  {
    inputName: 'app2|server2',
    stream: 'app2',
    source: 'server2',
  },
]

test('defaults to a single screen', () => {
  const { getByTestId, getByTitle } = render(
    <App socket={socket} initialState={initialTestState} />
  )
  const screen0 = getByTestId('screen-0')
  expect(screen0).toBeDefined()
})

test('rendering new inputs sent from server', () => {
  const { getByText, getAllByText } = render(
    <App socket={socket} initialState={initialTestState} />
  )
  act(() => {
    testInputs.forEach((testInput) => {
      socket.trigger('+input', testInput)
    })
  })
  const app1Stream = getByText("app1")
  const app2Stream = getByText("app2")
  const server1Source = getAllByText("server1")
  const server2Source = getAllByText("server2")
  expect(app1Stream).toBeDefined()
  expect(app2Stream).toBeDefined()
  expect(server1Source.length).toBe(2)
  expect(server2Source.length).toBe(2)
})

test('adding more screens', () => {
  const { getByRole, getByTestId, getByText, getByTitle } = render(
    <App socket={socket} initialState={initialTestState} />
  )
  fireEvent.click(getByTestId('add-screen-btn'))
  const screen0 = getByTestId('screen-0')
  const screen1 = getByTestId('screen-1')
})

test('multiple screens and inputs', () => {
  const { getAllByRole, getByText, getByTestId, getByTitle } = render(
    <App socket={socket} initialState={initialTestState} />
  )
  fireEvent.click(getByTestId('add-screen-btn'))
  act(() => {
    testInputs.forEach((testInput) => {
      socket.trigger('+input', testInput)
    })
  })
  getByTestId('input-control-app1|server1:0')
  getByTestId('input-control-app1|server1:1')
  getByTestId('input-control-app1|server2:0')
  getByTestId('input-control-app1|server2:1')
  getByTestId('input-control-app2|server1:0')
  getByTestId('input-control-app2|server1:1')
  getByTestId('input-control-app2|server2:0')
  getByTestId('input-control-app2|server2:1')
})

test('send input activation messages to server', () => {
  const { getAllByRole, getByText, getByTestId, getByTitle } = render(
    <App socket={socket} initialState={initialTestState} />
  )
  act(() => {
    socket.trigger('+input', testInputs[0])
  })
  fireEvent.click(getByTestId('input-control-app1|server1:0'))
  expect(socket.emit).toBeCalledWith('+activate', 'app1|server1')
  fireEvent.click(getByTestId('input-control-app1|server1:0'))
  expect(socket.emit).toBeCalledWith('-activate', 'app1|server1')
})

test('send stream activation messages to server', () => {
  const { getAllByRole, getByText, getByTestId, getByTitle } = render(
    <App socket={socket} initialState={initialTestState} />
  )
  fireEvent.click(getByTestId('add-screen-btn'))
  act(() => {
    testInputs.forEach((testInput) => {
      socket.trigger('+input', testInput)
    })
  })
  // Bind a stream
  fireEvent.click(getByTestId('group-control-app1:0'))
  expect(socket.emit).toBeCalledWith('+activate', 'app1|server1')
  expect(socket.emit).toBeCalledWith('+activate', 'app1|server2')
  // Unbind a stream
  fireEvent.click(getByTestId('group-control-app1:0'))
  expect(socket.emit).toBeCalledWith('-activate', 'app1|server1')
  expect(socket.emit).toBeCalledWith('-activate', 'app1|server2')
})

test('render messages to screen', () => {
  const { getAllByRole, getByText, getByTestId, getByTitle, queryByText } = render(
    <App socket={socket} initialState={initialTestState} />
  )
  fireEvent.click(getByTestId('add-screen-btn'))
  const screen0 = getByTestId('screen-0')
  act(() => {
    testInputs.forEach((testInput) => {
      socket.trigger('+input', testInput)
    })
  })
  // Bind all stream sources to screen 0
  fireEvent.click(getByTestId('group-control-app1:0'))
  act(() => {
    socket.trigger('+msg', {inputName: 'app1|server1', stream: 'app1', source: 'server1', msg: 'msg123'})
    socket.trigger('+msg', {inputName: 'app1|server1', stream: 'app1', source: 'server1', msg: 'msg456'})
    socket.trigger('+msg', {inputName: 'app2|server1', stream: 'app2', source: 'server1', msg: 'msg789'})
  })
  getByText('[app1] [server1] - msg123')
  getByText('[app1] [server1] - msg456')
  expect(queryByText('[app2] [server1] - msg789')).toBeNull()
  // Unbind a single source from screen 0
  fireEvent.click(getByTestId('input-control-app1|server1:0'))
  act(() => {
    socket.trigger('+msg', {inputName: 'app1|server1', stream: 'app1', source: 'server1', msg: 'msg111'})
    socket.trigger('+msg', {inputName: 'app1|server2', stream: 'app1', source: 'server2', msg: 'msg222'})
    socket.trigger('+msg', {inputName: 'app2|server1', stream: 'app2', source: 'server1', msg: 'msg333'})
  })
  getByText('[app1] [server2] - msg222')
  expect(queryByText('[app1] [server1] - msg111')).toBeNull()
  expect(queryByText('[app2] [server1] - msg333')).toBeNull()
})
