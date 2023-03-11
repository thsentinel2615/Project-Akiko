import React, { useState } from "react";

const Characters = () => {
const [characters, setCharacters] = useState([]);

  function addCharacter(newCharacter) {
    setCharacters([...characters, { ...newCharacter, id: Date.now(), avatar: URL.createObjectURL(newCharacter.avatar) }]);
  }

  function CharacterForm({ onCharacterSubmit }) {
    const [characterName, setCharacterName] = useState('');
    const [characterDescription, setCharacterDescription] = useState('');
    const [characterScenario, setCharacterScenario] = useState('');
    const [characterGreeting, setCharacterGreeting] = useState('');
    const [characterExamples, setCharacterExamples] = useState('');
    const [characterAvatar, setCharacterAvatar] = useState('');

    function handleSubmit(event) {
      event.preventDefault();
  
      const newCharacter = {
        name: characterName,
        description: characterDescription,
        scenario: characterScenario,
        greeting: characterGreeting,
        examples: characterExamples,
        avatar: characterAvatar
        // Other form input values
      };
  
      onCharacterSubmit(newCharacter);
  
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
    <ul>
      {characters.map((character) => (
        <li key={character.id} className="character-info-box">
          <h2><b>{character.name}</b></h2>
          <img src={character.avatar} alt={character.name} id="character-avatar"/>
          <p>{character.description}</p>
          {/* Other character information */}
        </li>
      ))}
    </ul>
  </div>
);
};

export default Characters;
