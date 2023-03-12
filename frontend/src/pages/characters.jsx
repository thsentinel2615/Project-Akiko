import React, { useState, useEffect } from "react";
import { io } from 'socket.io-client';

const Characters = () => {
const [characters, setCharacters] = useState([]);
const socket = io('http://localhost:5100');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

  function addCharacter(newCharacter) {
    const formData = new FormData();
    formData.append('char_id', newCharacter.char_id);
    formData.append('name', newCharacter.name);
    formData.append('description', newCharacter.description);
    formData.append('scenario', newCharacter.scenario);
    formData.append('greeting', newCharacter.greeting);
    formData.append('examples', newCharacter.examples);
    formData.append('avatar', newCharacter.avatar);

    fetch('http://localhost:5100/api/characters', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        setCharacters([...characters, {...newCharacter, avatar: data.avatar}]);
      })
      .catch(error => {
        console.error(error);
      });
  }

  function CharacterForm({ onCharacterSubmit }) {
    const [characterName, setCharacterName] = useState('');
    const [characterDescription, setCharacterDescription] = useState('');
    const [characterScenario, setCharacterScenario] = useState('');
    const [characterGreeting, setCharacterGreeting] = useState('');
    const [characterExamples, setCharacterExamples] = useState('');
    const [characterAvatar, setCharacterAvatar] = useState(null);

    function handleSubmit(event) {
      event.preventDefault();

      const newCharacter = {
        char_id: Date.now(),
        name: characterName,
        description: characterDescription,
        scenario: characterScenario,
        greeting: characterGreeting,
        examples: characterExamples,
        avatar: characterAvatar,
        // Other form input values
      };
      
      onCharacterSubmit(newCharacter);
      // Emit a socket event with the new character data
      socket.emit('add_character', newCharacter);
      
      socket.on('characters_updated', (data) => {
        console.log(data.message);
      });
      // Reset form input values
      setCharacterName('');
      setCharacterDescription('');
      setCharacterScenario('');
      setCharacterGreeting('');
      setCharacterExamples('');
      setCharacterAvatar(null);
      // Reset other input field state variables
    }
    return (
    <div className="character-form">
      <form onSubmit={handleSubmit} encType="multipart/form-data">
      <div className="character-input">
        <label htmlFor="characterAvatar"><b>Character Avatar:</b></label>
        <input
          id="character-field"
          type="file"
          accept="image/*"
          onChange={(event) => setCharacterAvatar(event.target.files[0])}
        />
        <label htmlFor="characterName"><b>Name:</b></label>
        <input
          id="character-field"
          type="text"
          value={characterName}
          onChange={(event) => setCharacterName(event.target.value)}
        />
        <label htmlFor="characterDescription"><b>Description:</b></label>
        <textarea 
          id="character-field"
          value={characterDescription}
          onChange={(event) => setCharacterDescription(event.target.value)}
        />
        <label htmlFor="characterScenario"><b>Scenario:</b></label>
        <textarea 
          id="character-field"
          value={characterScenario}
          onChange={(event) => setCharacterScenario(event.target.value)}
        />
        <label htmlFor="characterGreeting"><b>Greeting:</b></label>
        <textarea 
          id="character-field"
          value={characterGreeting}
          onChange={(event) => setCharacterGreeting(event.target.value)}
        />
        <label htmlFor="characterExamples"><b>Dialogue Examples:</b></label>
        <textarea 
          id="character-field"
          value={characterExamples}
          onChange={(event) => setCharacterExamples(event.target.value)}
        />
        </div>
        <button id="character-submit" type="submit">
          Submit
        </button>
      </form>
    </div>
    );
  }
      
return (
  <div>
    <CharacterForm onCharacterSubmit={addCharacter} />
    <div className="character-display">
      {characters.map((character) => (
        <div key={character.char_id} className="character-info-box">
          <h2><b>{character.name}</b></h2>
          {console.log(character.avatar)}
          {character.avatar && <img src={'http://localhost:5100/api/characters/images/'+character.avatar} alt={character.name} id="character-avatar"/>}
          <p>{character.description}</p>
          {/* Other character information */}
        </div>
      ))}
    </div>
  </div>
);  
};

export default Characters;
