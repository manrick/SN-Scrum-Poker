/**
 * Enhanced Scrum Poker Service using ServiceNow AMB (Asynchronous Message Bus)
 * for real-time updates via record watchers instead of polling
 */
export class ScrumPokerWebSocketService {
    constructor() {
        this.baseUrl = '/api/x_250424_sn_scrum8/scrum_poker'
        this.ambClient = null
        this.channels = new Map()
        this.subscriptions = new Map()
        this.isConnected = false
        
        // Initialize AMB client
        this.initializeAMBClient()
    }

    /**
     * Initialize ServiceNow AMB Client using the correct API
     */
    async initializeAMBClient() {
        try {
            console.log('Initializing AMB Client...')
            
            // Check if AMB is available and get the client
            if (typeof window !== 'undefined' && window.amb && typeof window.amb.getClient === 'function') {
                console.log('AMB found, getting client...')
                
                this.ambClient = window.amb.getClient()
                
                if (this.ambClient) {
                    console.log('AMB Client obtained')
                    console.log('Available AMB methods:', Object.getOwnPropertyNames(this.ambClient).filter(name => typeof this.ambClient[name] === 'function'))
                    
                    // Check initial connection state using correct method
                    const initialState = window.amb.getClient().getServerConnection().getState()
                    console.log('Initial AMB Connection State:', initialState)
                    
                    if (initialState !== 'opened') {
                        console.log('Connecting AMB client...')
                        await this.ambClient.connect()
                    }
                    
                    // Verify final connection state
                    const finalState = window.amb.getClient().getServerConnection().getState()
                    this.isConnected = finalState === 'opened'
                    
                    console.log('Final AMB Connection State:', finalState)
                    console.log('AMB Client connected:', this.isConnected)
                    
                    if (this.isConnected) {
                        console.log('✅ AMB Client successfully connected - Real-time updates available')
                    } else {
                        console.warn('⚠️ AMB Client connection failed - Manual refresh required')
                        console.log('Expected state: "opened", Actual state:', finalState)
                    }
                } else {
                    console.warn('Failed to get AMB client instance')
                }
            } else {
                console.warn('ServiceNow AMB not available - manual refresh mode')
                console.log('window.amb available:', !!window.amb)
                console.log('window.amb.getClient type:', typeof window.amb?.getClient)
            }
        } catch (error) {
            console.error('Failed to initialize AMB Client:', error)
            this.isConnected = false
        }
    }

    /**
     * Set up record watcher for a specific table using correct ServiceNow AMB pattern
     */
    setupRecordWatcher(tableName, query, callback) {
        if (!this.ambClient || !this.isConnected) {
            console.warn(`AMB Client not available for watching table: ${tableName}`)
            return null
        }

        try {
            console.log(`Setting up record watcher for table: ${tableName}`)
            console.log(`Query constraint: ${query}`)
            
            // 1. Create a channel for the table using /rw/{tableName} pattern
            const channelPath = `/rw/${tableName}`
            const channel = this.ambClient.getChannel(channelPath)
            
            if (!channel) {
                console.error(`Failed to get channel for ${channelPath}`)
                return null
            }
            
            console.log(`Channel created for: ${channelPath}`)
            
            // 2. Set query constraints (optional, using GlideRecord syntax)
            if (query) {
                channel.setQuery(query)
                console.log(`Query constraint set: ${query}`)
            }
            
            // 3. Add a listener for incoming messages
            const subscription = channel.subscribe((message) => {
                console.log(`Record change detected on ${tableName}:`, message)
                
                // Extract data from message
                const data = message.data || message
                
                callback({
                    tableName: data.tableName || tableName,
                    operation: data.operation, // 'insert', 'update', 'delete'
                    record: data.record,       // the changed record fields
                    rawMessage: message        // full message for debugging
                })
            })
            
            // Store channel and subscription for cleanup
            const watcherId = `${tableName}_${Date.now()}`
            this.channels.set(watcherId, channel)
            this.subscriptions.set(watcherId, subscription)
            
            console.log(`✅ Record watcher established for ${tableName} with ID: ${watcherId}`)
            return watcherId
            
        } catch (error) {
            console.error(`Error setting up record watcher for ${tableName}:`, error)
            return null
        }
    }

    /**
     * Watch session-related tables for changes
     */
    watchSession(sessionId, callbacks) {
        console.log(`Setting up session watchers for session ID: ${sessionId}`)
        
        const watchers = {}

        // Watch poker session changes
        watchers.session = this.setupRecordWatcher(
            'x_250424_sn_scrum8_poker_session',
            `sys_id=${sessionId}`, // GlideRecord syntax
            (change) => {
                console.log('Session record change:', change)
                if (callbacks.onSessionUpdate) {
                    callbacks.onSessionUpdate(change.record, change.operation)
                }
            }
        )

        // Watch participant changes  
        watchers.participants = this.setupRecordWatcher(
            'x_250424_sn_scrum8_session_participant',
            `session=${sessionId}`, // GlideRecord syntax
            (change) => {
                console.log('Participant record change:', change)
                if (callbacks.onParticipantsUpdate) {
                    callbacks.onParticipantsUpdate({
                        operation: change.operation,
                        participant: change.record
                    })
                }
            }
        )

        // Watch vote changes
        watchers.votes = this.setupRecordWatcher(
            'x_250424_sn_scrum8_poker_vote',
            `session=${sessionId}`, // GlideRecord syntax
            (change) => {
                console.log('Vote record change:', change)
                if (callbacks.onVotesUpdate) {
                    callbacks.onVotesUpdate({
                        operation: change.operation,
                        vote: change.record
                    })
                }
            }
        )

        console.log('Session watchers setup complete:', watchers)
        return watchers
    }

    /**
     * Stop watching session-related tables
     */
    unwatchSession(watchers) {
        if (watchers && typeof watchers === 'object') {
            Object.entries(watchers).forEach(([key, watcherId]) => {
                if (watcherId) {
                    this.stopRecordWatcher(watcherId)
                    console.log(`Stopped watching ${key} with ID: ${watcherId}`)
                }
            })
        }
    }

    /**
     * Stop a specific record watcher
     */
    stopRecordWatcher(watcherId) {
        if (this.subscriptions.has(watcherId)) {
            const subscription = this.subscriptions.get(watcherId)
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe()
                console.log(`Unsubscribed from ${watcherId}`)
            }
            this.subscriptions.delete(watcherId)
        }
        
        if (this.channels.has(watcherId)) {
            const channel = this.channels.get(watcherId)
            // Channel cleanup if needed
            this.channels.delete(watcherId)
        }
        
        console.log(`Record watcher ${watcherId} stopped`)
    }

    /**
     * Get connection status for UI display using correct method
     */
    getConnectionStatus() {
        let connectionState = 'UNAVAILABLE'
        let connected = false
        
        try {
            if (window.amb && window.amb.getClient) {
                connectionState = window.amb.getClient().getServerConnection().getState()
                connected = connectionState === 'opened'
            }
        } catch (error) {
            console.error('Error getting connection state:', error)
        }
        
        return {
            connected: connected,
            clientAvailable: !!this.ambClient,
            ambAvailable: !!(typeof window !== 'undefined' && window.amb),
            connectionState: connectionState
        }
    }

    /**
     * Enhanced REST API methods (keeping existing functionality)
     */
    async makeRestCall(endpoint, method = 'GET', data = null) {
        try {
            console.log(`Making ${method} request to:`, `${this.baseUrl}${endpoint}`)
            console.log('Request data:', data)
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-UserToken': window.g_ck || '',
                },
                credentials: 'same-origin'
            }
            
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data)
            }
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, options)
            
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
            const actualData = responseData.result || responseData
            
            return actualData
        } catch (error) {
            console.error('REST API Error:', error)
            throw error
        }
    }

    // Keep all existing REST methods
    async createSession(sessionName) {
        return this.makeRestCall('/session', 'POST', {
            session_name: sessionName
        })
    }

    async joinSession(sessionCode) {
        return this.makeRestCall('/session/join', 'POST', {
            session_code: sessionCode
        })
    }

    async getParticipants(sessionId) {
        const response = await this.makeRestCall(`/session/${sessionId}/participants`)
        return response.participants || []
    }

    async startVoting(sessionId, storyId) {
        return this.makeRestCall(`/session/${sessionId}/voting/start`, 'POST', {
            story_id: storyId
        })
    }

    async submitVote(sessionId, storyId, voteValue) {
        return this.makeRestCall(`/session/${sessionId}/vote`, 'POST', {
            story_id: storyId,
            vote_value: voteValue
        })
    }

    async revealVotes(sessionId) {
        return this.makeRestCall(`/session/${sessionId}/voting/reveal`, 'POST')
    }

    async finalizeStoryPoints(sessionId, finalPoints) {
        return this.makeRestCall(`/session/${sessionId}/finalize`, 'POST', {
            final_points: finalPoints
        })
    }

    async getSessionStatus(sessionId) {
        return this.makeRestCall(`/session/${sessionId}/status`)
    }

    async getStories() {
        const response = await this.makeRestCall('/stories')
        return response.stories || []
    }

    /**
     * Cleanup method to disconnect AMB client and stop all watchers
     */
    disconnect() {
        console.log('Disconnecting AMB client and cleaning up watchers...')
        
        // Stop all record watchers
        const watcherIds = Array.from(this.subscriptions.keys())
        watcherIds.forEach(watcherId => {
            this.stopRecordWatcher(watcherId)
        })

        // Clear collections
        this.subscriptions.clear()
        this.channels.clear()

        // Disconnect AMB client
        if (this.ambClient && this.isConnected) {
            try {
                this.ambClient.disconnect()
                console.log('AMB Client disconnected')
            } catch (error) {
                console.error('Error disconnecting AMB client:', error)
            }
            this.isConnected = false
        }
    }
}