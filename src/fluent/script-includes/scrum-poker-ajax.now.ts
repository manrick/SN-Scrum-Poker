import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

export const ScrumPokerAjax = ScriptInclude({
  $id: Now.ID['ScrumPokerAjax'],
  name: 'ScrumPokerAjax',
  script: Now.include('../../server/script-includes/scrum-poker-ajax.js'),
  description: 'Ajax processor for Scrum Poker real-time operations',
  apiName: 'x_250424_sn_scrum8.ScrumPokerAjax',
  callerAccess: 'tracking',
  clientCallable: true,
  mobileCallable: true,
  sandboxCallable: true,
  accessibleFrom: 'public',
  active: true
})