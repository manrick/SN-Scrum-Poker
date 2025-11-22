import React, { useState, useEffect } from 'react';
import './StorySelector.css';

export default function StorySelector({ service, onStorySelected }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const storiesData = await service.getStories();
      setStories(storiesData);
    } catch (error) {
      setError('Failed to load stories');
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    if (!searchTerm) return true;
    
    const number = typeof story.number === 'object' ? story.number.display_value : story.number;
    const shortDesc = typeof story.short_description === 'object' ? 
      story.short_description.display_value : story.short_description;
    
    return (
      number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortDesc?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleStoryClick = (story) => {
    const storyId = typeof story.sys_id === 'object' ? story.sys_id.value : story.sys_id;
    const number = typeof story.number === 'object' ? story.number.display_value : story.number;
    const shortDesc = typeof story.short_description === 'object' ? 
      story.short_description.display_value : story.short_description;
    const description = typeof story.description === 'object' ? 
      story.description.display_value : story.description;

    onStorySelected({
      sys_id: storyId,
      number: number,
      short_description: shortDesc,
      description: description
    });
  };

  if (loading) {
    return <div className="story-selector loading">Loading stories...</div>;
  }

  if (error) {
    return (
      <div className="story-selector error">
        <p>{error}</p>
        <button onClick={loadStories}>Retry</button>
      </div>
    );
  }

  return (
    <div className="story-selector">
      <h3>Select a Story to Estimate</h3>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search stories by number or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="stories-list">
        {filteredStories.length === 0 ? (
          <div className="no-stories">
            {searchTerm ? 'No stories match your search.' : 'No stories available.'}
          </div>
        ) : (
          filteredStories.map(story => {
            const storyId = typeof story.sys_id === 'object' ? story.sys_id.value : story.sys_id;
            const number = typeof story.number === 'object' ? story.number.display_value : story.number;
            const shortDesc = typeof story.short_description === 'object' ? 
              story.short_description.display_value : story.short_description;
            const currentPoints = typeof story.story_points === 'object' ? 
              story.story_points.display_value : story.story_points;

            return (
              <div 
                key={storyId}
                className="story-card"
                onClick={() => handleStoryClick(story)}
              >
                <div className="story-header">
                  <span className="story-number">{number}</span>
                  {currentPoints && (
                    <span className="current-points">{currentPoints} pts</span>
                  )}
                </div>
                <div className="story-title">{shortDesc}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}