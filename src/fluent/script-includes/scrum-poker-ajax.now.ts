import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

export const ScrumPokerAjax = ScriptInclude({
    $id: Now.ID['ScrumPokerAjax'],
    name: 'ScrumPokerAjax',
    script: Now.include('../../server/script-includes/scrum-poker-ajax.js'),
    description: 'Ajax processor for Scrum Poker real-time operations',
    clientCallable: true,
    mobileCallable: true,
    active: true,
})