import { gs, GlideRecord, GlideDateTime } from '@servicenow/glide'

var ScrumPokerAjax = Class.create()

ScrumPokerAjax.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

  // Simple test method
  generateSessionCode: function() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var code = ''
    for (var i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return JSON.stringify({ success: true, code: code })
  },

  // Create a new poker session
  createSession: function() {
    try {
      var sessionName = this.getParameter('sysparm_session_name')
      var sessionCode = this.generateSessionCodeInternal()
      var currentUser = gs.getUserID()
      
      gs.info('Creating session: ' + sessionName + ' for user: ' + currentUser)
      
      var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
      sessionGr.initialize()
      sessionGr.setValue('session_name', sessionName)
      sessionGr.setValue('session_code', sessionCode)
      sessionGr.setValue('scrum_master', currentUser)
      sessionGr.setValue('state', 'waiting')
      sessionGr.setValue('is_active', true)
      
      var sessionId = sessionGr.insert()
      
      if (sessionId) {
        // Add the scrum master as first participant
        var participantGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
        participantGr.initialize()
        participantGr.setValue('session', sessionId)
        participantGr.setValue('user', currentUser)
        participantGr.setValue('is_online', true)
        participantGr.insert()
        
        gs.info('Session created successfully: ' + sessionId)
        
        return JSON.stringify({
          success: true,
          session_id: sessionId,
          session_code: sessionCode
        })
      }
      
      gs.error('Failed to insert session record')
      return JSON.stringify({ success: false, error: 'Failed to create session' })
    } catch (e) {
      gs.error('Exception in createSession: ' + e.message)
      return JSON.stringify({ success: false, error: 'Server error: ' + e.message })
    }
  },

  // Join a session using session code
  joinSession: function() {
    try {
      var sessionCode = this.getParameter('sysparm_session_code')
      var currentUser = gs.getUserID()
      
      gs.info('User ' + currentUser + ' attempting to join session: ' + sessionCode)
      
      var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
      sessionGr.addQuery('session_code', sessionCode)
      sessionGr.addQuery('is_active', true)
      sessionGr.query()
      
      if (sessionGr.next()) {
        // Check if user already joined
        var existingGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
        existingGr.addQuery('session', sessionGr.getUniqueValue())
        existingGr.addQuery('user', currentUser)
        existingGr.query()
        
        if (!existingGr.next()) {
          // Add new participant
          var participantGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
          participantGr.initialize()
          participantGr.setValue('session', sessionGr.getUniqueValue())
          participantGr.setValue('user', currentUser)
          participantGr.setValue('is_online', true)
          participantGr.insert()
        } else {
          // Update existing participant to online
          existingGr.setValue('is_online', true)
          var now = new GlideDateTime()
          existingGr.setValue('last_activity', now.getDisplayValue())
          existingGr.update()
        }
        
        return JSON.stringify({
          success: true,
          session_id: sessionGr.getUniqueValue(),
          session_name: sessionGr.getValue('session_name'),
          is_scrum_master: sessionGr.getValue('scrum_master') === currentUser
        })
      }
      
      return JSON.stringify({ success: false, error: 'Session not found' })
    } catch (e) {
      gs.error('Exception in joinSession: ' + e.message)
      return JSON.stringify({ success: false, error: 'Server error: ' + e.message })
    }
  },

  // Get session participants
  getParticipants: function() {
    try {
      var sessionId = this.getParameter('sysparm_session_id')
      var participants = []
      
      var participantGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
      participantGr.addQuery('session', sessionId)
      participantGr.addQuery('is_online', true)
      participantGr.query()
      
      while (participantGr.next()) {
        var userGr = new GlideRecord('sys_user')
        if (userGr.get(participantGr.getValue('user'))) {
          participants.push({
            user_id: participantGr.getValue('user'),
            name: userGr.getDisplayValue(),
            joined_at: participantGr.getValue('joined_at')
          })
        }
      }
      
      return JSON.stringify({ participants: participants })
    } catch (e) {
      gs.error('Exception in getParticipants: ' + e.message)
      return JSON.stringify({ participants: [] })
    }
  },

  // Get list of stories from rm_story table
  getStories: function() {
    try {
      var stories = []
      var storyGr = new GlideRecord('rm_story')
      storyGr.addQuery('state', '!=', 'closed')
      storyGr.orderBy('number')
      storyGr.setLimit(100) // Limit to prevent large result sets
      storyGr.query()
      
      while (storyGr.next()) {
        stories.push({
          sys_id: storyGr.getUniqueValue(),
          number: storyGr.getValue('number'),
          short_description: storyGr.getValue('short_description'),
          description: storyGr.getValue('description'),
          story_points: storyGr.getValue('story_points')
        })
      }
      
      return JSON.stringify({ stories: stories })
    } catch (e) {
      gs.error('Exception in getStories: ' + e.message)
      return JSON.stringify({ stories: [] })
    }
  },

  // Start voting for a story
  startVoting: function() {
    try {
      var sessionId = this.getParameter('sysparm_session_id')
      var storyId = this.getParameter('sysparm_story_id')
      var currentUser = gs.getUserID()
      
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
        
        return JSON.stringify({ success: true })
      }
      
      return JSON.stringify({ success: false, error: 'Not authorized or session not found' })
    } catch (e) {
      gs.error('Exception in startVoting: ' + e.message)
      return JSON.stringify({ success: false, error: 'Server error: ' + e.message })
    }
  },

  // Submit a vote
  submitVote: function() {
    try {
      var sessionId = this.getParameter('sysparm_session_id')
      var storyId = this.getParameter('sysparm_story_id')
      var voteValue = this.getParameter('sysparm_vote_value')
      var currentUser = gs.getUserID()
      
      // Check if voting is still active
      var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
      if (sessionGr.get(sessionId) && sessionGr.getValue('state') === 'active') {
        
        // Check if user already voted, update existing vote
        var existingVoteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
        existingVoteGr.addQuery('session', sessionId)
        existingVoteGr.addQuery('story', storyId)
        existingVoteGr.addQuery('voter', currentUser)
        existingVoteGr.query()
        
        if (existingVoteGr.next()) {
          existingVoteGr.setValue('vote_value', voteValue)
          var now = new GlideDateTime()
          existingVoteGr.setValue('voted_at', now.getDisplayValue())
          existingVoteGr.update()
        } else {
          var voteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
          voteGr.initialize()
          voteGr.setValue('session', sessionId)
          voteGr.setValue('story', storyId)
          voteGr.setValue('voter', currentUser)
          voteGr.setValue('vote_value', voteValue)
          voteGr.insert()
        }
        
        return JSON.stringify({ success: true })
      }
      
      return JSON.stringify({ success: false, error: 'Voting not active' })
    } catch (e) {
      gs.error('Exception in submitVote: ' + e.message)
      return JSON.stringify({ success: false, error: 'Server error: ' + e.message })
    }
  },

  // Reveal votes
  revealVotes: function() {
    try {
      var sessionId = this.getParameter('sysparm_session_id')
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
        
        return JSON.stringify({ success: true, votes: votes })
      }
      
      return JSON.stringify({ success: false, error: 'Not authorized' })
    } catch (e) {
      gs.error('Exception in revealVotes: ' + e.message)
      return JSON.stringify({ success: false, error: 'Server error: ' + e.message })
    }
  },

  // Finalize story points
  finalizeStoryPoints: function() {
    try {
      var sessionId = this.getParameter('sysparm_session_id')
      var finalPoints = this.getParameter('sysparm_final_points')
      var currentUser = gs.getUserID()
      
      var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
      if (sessionGr.get(sessionId) && sessionGr.getValue('scrum_master') === currentUser) {
        var storyId = sessionGr.getValue('current_story')
        
        // Update the story with the final points
        var storyGr = new GlideRecord('rm_story')
        if (storyGr.get(storyId)) {
          storyGr.setValue('story_points', finalPoints)
          storyGr.update()
          
          // Reset session state for next story
          sessionGr.setValue('state', 'waiting')
          sessionGr.setValue('current_story', '')
          sessionGr.update()
          
          return JSON.stringify({ success: true })
        }
      }
      
      return JSON.stringify({ success: false, error: 'Not authorized or story not found' })
    } catch (e) {
      gs.error('Exception in finalizeStoryPoints: ' + e.message)
      return JSON.stringify({ success: false, error: 'Server error: ' + e.message })
    }
  },

  // Get session status
  getSessionStatus: function() {
    try {
      var sessionId = this.getParameter('sysparm_session_id')
      
      var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
      if (sessionGr.get(sessionId)) {
        var response = {
          state: sessionGr.getValue('state'),
          current_story: sessionGr.getValue('current_story'),
          voting_started_at: sessionGr.getValue('voting_started_at'),
          voting_duration: parseInt(sessionGr.getValue('voting_duration'))
        }
        
        // Get current story details if available
        if (sessionGr.getValue('current_story')) {
          var storyGr = new GlideRecord('rm_story')
          if (storyGr.get(sessionGr.getValue('current_story'))) {
            response.story_details = {
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
          response.votes_count = voteGr.getRowCount()
        }
        
        return JSON.stringify(response)
      }
      
      return JSON.stringify({ error: 'Session not found' })
    } catch (e) {
      gs.error('Exception in getSessionStatus: ' + e.message)
      return JSON.stringify({ error: 'Server error: ' + e.message })
    }
  },

  // Internal method to generate session code
  generateSessionCodeInternal: function() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var code = ''
    for (var i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },

  type: 'ScrumPokerAjax'
})