(function revealVotes(request, response) {
    try {
        var sessionId = request.pathParams.session_id
        var currentUser = gs.getUserID()
        
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        if (sessionGr.get(sessionId) && sessionGr.getValue('scrum_master') === currentUser) {
            sessionGr.setValue('state', 'revealing')
            sessionGr.update()
            
            var storyId = sessionGr.getValue('current_story')
            var votes = []
            
            var voteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
            voteGr.addQuery('session', sessionId)
            voteGr.addQuery('story', storyId)
            voteGr.query()
            
            while (voteGr.next()) {
                var userGr = new GlideRecord('sys_user')
                if (userGr.get(voteGr.getValue('voter'))) {
                    votes.push({
                        voter: userGr.getDisplayValue(),
                        vote: voteGr.getValue('vote_value')
                    })
                }
            }
            
            response.setStatus(200)
            response.setBody({ success: true, votes: votes })
        } else {
            response.setStatus(403)
            response.setBody({ success: false, error: 'Not authorized' })
        }
    } catch (e) {
        gs.error('Exception in revealVotes: ' + e.message)
        response.setStatus(500)
        response.setBody({ success: false, error: 'Server error: ' + e.message })
    }
})(request, response)