import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import scrumMasterHtml from '../../client/scrum-master.html'

export const scrum_master_page = UiPage({
  $id: Now.ID['scrum-master-page'],
  endpoint: 'x_250424_sn_scrum8_scrum_master.do',
  description: 'Scrum Master UI for managing poker sessions',
  category: 'general',
  html: scrumMasterHtml,
  direct: true
})