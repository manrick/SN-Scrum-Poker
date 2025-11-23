import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'
import { handleSessionStateChange } from '../../server/business-rules/session-state-change.js'

// Business rule to track session state changes for real-time updates
export const session_state_change_br = BusinessRule({
    $id: Now.ID['session-state-change-br'],
    name: 'Poker Session State Change Handler',
    table: 'x_250424_sn_scrum8_poker_session',
    when: 'after',
    action: ['update'],
    script: handleSessionStateChange,
    active: true,
    order: 100,
    description: 'Logs session state changes for real-time update processing'
})