import { gs, GlideDateTime } from '@servicenow/glide'

/**
 * Business rule function to handle session state changes
 * Triggers when poker session records are updated
 */
export function handleSessionStateChange(current, previous) {
    try {
        // Check if state has changed
        const currentState = current.getValue('state')
        const previousState = previous.getValue('state')
        
        if (currentState !== previousState) {
            gs.info(`Poker session ${current.getValue('session_name')} state changed from ${previousState} to ${currentState}`)
            
            // Log significant state changes for websocket processing
            const sessionId = current.getUniqueValue()
            const changeData = {
                sessionId: sessionId,
                sessionName: current.getValue('session_name'),
                oldState: previousState,
                newState: currentState,
                timestamp: new GlideDateTime().getDisplayValue()
            }
            
            // Log for potential websocket/SSE pickup
            gs.info(`Session state change: ${JSON.stringify(changeData)}`)
            
            // Could potentially trigger a custom event here if ServiceNow supports it
            // gs.eventQueue('poker.session.state.changed', current, JSON.stringify(changeData))
        }
        
        // Check if current story has changed
        const currentStory = current.getValue('current_story')
        const previousStory = previous.getValue('current_story')
        
        if (currentStory !== previousStory) {
            gs.info(`Poker session ${current.getValue('session_name')} story changed from ${previousStory} to ${currentStory}`)
        }
        
        // Check if voting has started
        const currentVotingTime = current.getValue('voting_started_at')
        const previousVotingTime = previous.getValue('voting_started_at')
        
        if (currentVotingTime && !previousVotingTime) {
            gs.info(`Voting started for session ${current.getValue('session_name')}`)
        }
        
    } catch (error) {
        gs.error('Error in session state change handler: ' + error.message)
    }
}