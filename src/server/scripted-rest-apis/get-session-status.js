(function getSessionStatus(request, response) {
    try {
        var sessionId = request.pathParams.session_id
        
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        if (sessionGr.get(sessionId)) {
            var responseData = {
                state: sessionGr.getValue('state'),
                current_story: sessionGr.getValue('current_story'),
                voting_started_at: sessionGr.getValue('voting_started_at'),
                voting_duration: parseInt(sessionGr.getValue('voting_duration'))
            }
            
            // Get current story details if available
            if (sessionGr.getValue('current_story')) {
                var storyGr = new GlideRecord('rm_story')
                if (storyGr.get(sessionGr.getValue('current_story'))) {
                    responseData.story_details = {
                        number: storyGr.getValue('number'),
                        short_description: storyGr.getValue('short_description'),
                        description: storyGr.getValue('description')
                    }
                }
            }
            
            // Get vote count for current story if voting is active
            if (sessionGr.getValue('state') === 'active' && sessionGr.getValue('current_story')) {
                var voteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
                voteGr.addQuery('session', sessionId)
                voteGr.addQuery('story', sessionGr.getValue('current_story'))
                voteGr.query()
                responseData.votes_count = voteGr.getRowCount()
            }
            
            response.setStatus(200)
            response.setBody(responseData)
        } else {
            response.setStatus(404)
            response.setBody({ error: 'Session not found' })
        }
    } catch (e) {
        gs.error('Exception in getSessionStatus: ' + e.message)
        response.setStatus(500)
        response.setBody({ error: 'Server error: ' + e.message })
    }
})(request, response)