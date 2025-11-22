import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import scrumUserHtml from '../../client/scrum-user.html'

export const scrum_user_page = UiPage({
  $id: Now.ID['scrum-user-page'],
  endpoint: 'x_250424_sn_scrum8_scrum_user.do',
  description: 'Scrum User UI for participating in poker sessions',
  category: 'general',
  html: scrumUserHtml,
  direct: true
})