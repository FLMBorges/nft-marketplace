import { setupWorker } from 'msw/browser'
import { mockControl } from './control'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

window.__kurioMock = mockControl
