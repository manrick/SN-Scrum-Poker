(function submitVote(request, response) {
    try {
        var sessionId = request.pathParams.session_id
        var requestBody = request.body.data
        var storyId = requestBody.story_id
        var voteValue = requestBody.vote_value
        var currentUser = gs.getUserID()
        
        if (!storyId || !voteValue) {
            response.setStatus(400)
            response.setBody({ success: false, error: 'Story ID and vote value are required' })
            return
        }
        
        // Check if voting is still active
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        if (sessionGr.get(sessionId) && sessionGr.getValue('state') === 'active') {
            
            var now = new GlideDateTime()
            
            // Check if user already voted, update existing vote
            var existingVoteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
            existingVoteGr.addQuery('session', sessionId)
            existingVoteGr.addQuery('story', storyId)
            existingVoteGr.addQuery('voter', currentUser)
            existingVoteGr.query()
            
            if (existingVoteGr.next()) {
                existingVoteGr.setValue('vote_value', voteValue)
                existingVoteGr.setValue('voted_at', now.getDisplayValue())
                existingVoteGr.update()
            } else {
                var voteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
                voteGr.initialize()
                voteGr.setValue('session', sessionId)
                voteGr.setValue('story', storyId)
                voteGr.setValue('voter', currentUser)
                voteGr.setValue('vote_value', voteValue)
                voteGr.setValue('voted_at', now.getDisplayValue())
                voteGr.insert()
            }
            
            response.setStatus(200)
            response.setBody({ success: true })
        } else {
            response.setStatus(400)
            response.setBody({ success: false, error: 'Voting not active' })
        }
    } catch (e) {
        gs.error('Exception in submitVote: ' + e.message)
        response.setStatus(500)
        response.setBody({ success: false, error: 'Server error: ' + e.message })
    }
})(request, response)