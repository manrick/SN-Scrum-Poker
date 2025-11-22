(function startVoting(request, response) {
    try {
        var sessionId = request.pathParams.session_id
        var requestBody = request.body.data
        var storyId = requestBody.story_id
        var currentUser = gs.getUserID()
        
        if (!storyId) {
            response.setStatus(400)
            response.setBody({ success: false, error: 'Story ID is required' })
            return
        }
        
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        if (sessionGr.get(sessionId) && sessionGr.getValue('scrum_master') === currentUser) {
            sessionGr.setValue('current_story', storyId)
            sessionGr.setValue('state', 'active')
            var now = new GlideDateTime()
            sessionGr.setValue('voting_started_at', now.getDisplayValue())
            sessionGr.update()
            
            // Clear any existing votes for this story in this session
            var voteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
            voteGr.addQuery('session', sessionId)
            voteGr.addQuery('story', storyId)
            voteGr.deleteMultiple()
            
            response.setStatus(200)
            response.setBody({ success: true })
        } else {
            response.setStatus(403)
            response.setBody({ success: false, error: 'Not authorized or session not found' })
        }
    } catch (e) {
        gs.error('Exception in startVoting: ' + e.message)
        response.setStatus(500)
        response.setBody({ success: false, error: 'Server error: ' + e.message })
    }
})(request, response)