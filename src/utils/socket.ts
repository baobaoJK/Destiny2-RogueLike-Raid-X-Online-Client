import { io } from 'socket.io-client'

let socket: any = null

// const baseURL = 'http://127.0.0.1:5000'
const baseURL = 'http://10.8.0.3:5000'

export function getSocket() {
  if (!socket) {
    console.log('Socket 创建')
    socket = io(baseURL)
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
