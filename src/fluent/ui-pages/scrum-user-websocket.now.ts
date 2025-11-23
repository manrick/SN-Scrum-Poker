import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import scrumUserWebSocketHtml from '../../client/scrum-user-websocket.html'

export const scrum_user_websocket_page = UiPage({
  $id: Now.ID['scrum-user-websocket-page'],
  endpoint: 'x_250424_sn_scrum8_scrum_user_ws.do',
  description: 'Scrum User UI with WebSocket real-time updates for participating in poker sessions',
  category: 'general',
  html: scrumUserWebSocketHtml,
  direct: true
})