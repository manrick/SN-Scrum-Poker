import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import scrumMasterWebSocketHtml from '../../client/scrum-master-websocket.html'

export const scrum_master_websocket_page = UiPage({
  $id: Now.ID['scrum-master-websocket-page'],
  endpoint: 'x_250424_sn_scrum8_scrum_master_ws.do',
  description: 'Scrum Master UI with WebSocket real-time updates for managing poker sessions',
  category: 'general',
  html: scrumMasterWebSocketHtml,
  direct: true
})