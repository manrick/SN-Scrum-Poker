export class ScrumPokerService {
    constructor() {
        this.baseUrl = '/xmlhttp.do'
    }

    async makeAjaxCall(method, params = {}) {
        return new Promise((resolve, reject) => {
            console.log('Making Ajax call:', method, params)
            
            // Create the GlideAjax call with the fully scoped name
            const ga = new GlideAjax('x_250424_sn_scrum8.ScrumPokerAjax')
            ga.addParam('sysparm_name', method)
            
            // Add all parameters
            Object.keys(params).forEach(key => {
                ga.addParam(key, params[key])
                console.log('Added param:', key, params[key])
            })

            ga.getXML((response) => {
                console.log('Raw Ajax response:', response)
                
                try {
                    const responseText = response.responseText
                    console.log('Response text:', responseText)
                    
                    if (!responseText) {
                        throw new Error('Empty response from server')
                    }
                    
                    let data
                    try {
                        data = JSON.parse(responseText)
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError)
                        console.log('Raw response that failed to parse:', responseText)
                        throw new Error('Invalid JSON response from server: ' + responseText)
                    }
                    
                    console.log('Parsed data:', data)
                    
                    if (data.success !== undefined) {
                        if (data.success) {
                            resolve(data)
                        } else {
                            reject(new Error(data.error || 'Unknown error'))
                        }
                    } else {
                        resolve(data)
                    }
                } catch (error) {
                    console.error('Error processing Ajax response:', error)
                    reject(error)
                }
            })

            // Add error handling for failed requests
            ga.getXMLWait = function() {
                console.error('Ajax call failed or timed out')
                reject(new Error('Ajax call failed or timed out'))
            }
        })
    }

    // Create a new poker session
    async createSession(sessionName) {
        console.log('Creating session with name:', sessionName)
        return this.makeAjaxCall('createSession', {
            sysparm_session_name: sessionName
        })
    }

    // Join a session using session code
    async joinSession(sessionCode) {
        console.log('Joining session with code:', sessionCode)
        return this.makeAjaxCall('joinSession', {
            sysparm_session_code: sessionCode
        })
    }

    // Get session participants
    async getParticipants(sessionId) {
        console.log('Getting participants for session:', sessionId)
        return this.makeAjaxCall('getParticipants', {
            sysparm_session_id: sessionId
        })
    }

    // Start voting for a story
    async startVoting(sessionId, storyId) {
        console.log('Starting voting for session:', sessionId, 'story:', storyId)
        return this.makeAjaxCall('startVoting', {
            sysparm_session_id: sessionId,
            sysparm_story_id: storyId
        })
    }

    // Submit a vote
    async submitVote(sessionId, storyId, voteValue) {
        console.log('Submitting vote:', sessionId, storyId, voteValue)
        return this.makeAjaxCall('submitVote', {
            sysparm_session_id: sessionId,
            sysparm_story_id: storyId,
            sysparm_vote_value: voteValue
        })
    }

    // Reveal votes
    async revealVotes(sessionId) {
        console.log('Revealing votes for session:', sessionId)
        return this.makeAjaxCall('revealVotes', {
            sysparm_session_id: sessionId
        })
    }

    // Finalize story points
    async finalizeStoryPoints(sessionId, finalPoints) {
        console.log('Finalizing story points:', sessionId, finalPoints)
        return this.makeAjaxCall('finalizeStoryPoints', {
            sysparm_session_id: sessionId,
            sysparm_final_points: finalPoints
        })
    }

    // Get session status
    async getSessionStatus(sessionId) {
        console.log('Getting session status:', sessionId)
        return this.makeAjaxCall('getSessionStatus', {
            sysparm_session_id: sessionId
        })
    }

    // Get list of stories from rm_story table
    async getStories() {
        console.log('Getting stories from rm_story table')
        return this.makeAjaxCall('getStories', {})
    }
}