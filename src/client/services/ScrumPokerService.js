export class ScrumPokerService {
    constructor() {
        this.baseUrl = '/api/x_250424_sn_scrum8/scrum_poker'
    }

    async makeRestCall(endpoint, method = 'GET', data = null) {
        try {
            console.log(`Making ${method} request to:`, `${this.baseUrl}${endpoint}`)
            console.log('Request data:', data)
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-UserToken': window.g_ck || '', // Include CSRF token if available
                },
                credentials: 'same-origin' // Include session cookies
            }
            
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data)
            }
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, options)
            
            console.log('Response status:', response.status)
            console.log('Response ok:', response.ok)
            
            if (!response.ok) {
                let errorText
                try {
                    const errorData = await response.json()
                    errorText = errorData.error || errorData.message || `HTTP ${response.status}`
                } catch (e) {
                    errorText = await response.text()
                }
                console.error('HTTP Error:', response.status, errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }
            
            const responseData = await response.json()
            console.log('Raw response data:', responseData)
            
            // ServiceNow REST APIs wrap responses in a "result" object
            const actualData = responseData.result || responseData
            console.log('Extracted data:', actualData)
            
            return actualData
        } catch (error) {
            console.error('REST API Error:', error)
            throw error
        }
    }

    // Create a new poker session
    async createSession(sessionName) {
        console.log('Creating session with name:', sessionName)
        return this.makeRestCall('/session', 'POST', {
            session_name: sessionName
        })
    }

    // Join a session using session code
    async joinSession(sessionCode) {
        console.log('Joining session with code:', sessionCode)
        return this.makeRestCall('/session/join', 'POST', {
            session_code: sessionCode
        })
    }

    // Get session participants
    async getParticipants(sessionId) {
        console.log('Getting participants for session:', sessionId)
        const response = await this.makeRestCall(`/session/${sessionId}/participants`)
        // Extract participants array from wrapped response
        return response.participants || []
    }

    // Start voting for a story
    async startVoting(sessionId, storyId) {
        console.log('Starting voting for session:', sessionId, 'story:', storyId)
        return this.makeRestCall(`/session/${sessionId}/voting/start`, 'POST', {
            story_id: storyId
        })
    }

    // Submit a vote
    async submitVote(sessionId, storyId, voteValue) {
        console.log('Submitting vote:', sessionId, storyId, voteValue)
        return this.makeRestCall(`/session/${sessionId}/vote`, 'POST', {
            story_id: storyId,
            vote_value: voteValue
        })
    }

    // Reveal votes
    async revealVotes(sessionId) {
        console.log('Revealing votes for session:', sessionId)
        return this.makeRestCall(`/session/${sessionId}/voting/reveal`, 'POST')
    }

    // Finalize story points
    async finalizeStoryPoints(sessionId, finalPoints) {
        console.log('Finalizing story points:', sessionId, finalPoints)
        return this.makeRestCall(`/session/${sessionId}/finalize`, 'POST', {
            final_points: finalPoints
        })
    }

    // Get session status
    async getSessionStatus(sessionId) {
        console.log('Getting session status:', sessionId)
        return this.makeRestCall(`/session/${sessionId}/status`)
    }

    // Get list of stories from rm_story table
    async getStories() {
        console.log('Getting stories from rm_story table')
        const response = await this.makeRestCall('/stories')
        // Extract stories array from wrapped response
        return response.stories || []
    }
}