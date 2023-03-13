import React, { useState, useEffect } from "react";
import { fetchCharacters, createCharacter, getCharacterImageUrl } from "../assets/components/api";

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCharacters()
      .then(data => setCharacters(data))
      .catch(error => {
        console.error(error);
        history.push('/error');
      });
  }, []);

  function addCharacter(newCharacter) {
    createCharacter(newCharacter)
      .then(avatar => {
        setCharacters([...characters, {...newCharacter, avatar: avatar}]);
      })
      .catch(error => {
        console.error(error);
        history.push('/error');
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

      if (!characterName) {
        alert("Please enter a name for your character.");
        return;
      }
      if (!characterAvatar) {
        alert("Please enter a name for your character.");
        return;
      }

      const newCharacter = {
        char_id: Date.now(),
        char_name: characterName || "Default Name",
        char_persona: characterDescription || "",
        world_scenario: characterScenario || "",
        char_greeting: characterGreeting || "",
        example_dialogue: characterExamples || "",
        avatar: characterAvatar,
        // Other form input values
      };
      
      onCharacterSubmit(newCharacter);
      // Emit a socket event with the new character data
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
      <div className="modal-overlay">
        <div className="character-form">
          <h1>Create Character</h1>
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
            <textarea
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
            <button id="character-close" onClick={() => setShowForm(false)}><b>Cancel</b></button>
            <button id="character-submit" type="submit">
              <b>Submit</b>
            </button>
          </form>
        </div>
      </div>
    );
  }
      
return (
  <div>
    <div className="character-buttons">
      <button id="character-button" onClick={() => setShowForm(true)}><b>Create Character</b></button>
    </div>
    {showForm && (
    <CharacterForm
    onCharacterSubmit={addCharacter}
    onClose={() => setShowForm(false)}
    />
    )}
    <div className="character-display">
      {characters.map((character) => (
        <div key={character.char_id} className="character-info-box">
          <h2><b>{character.char_name}</b></h2>
          {character.avatar && <img src={getCharacterImageUrl(character.avatar)} alt={character.char_name} id="character-avatar"/>}
          <p>{character.char_persona}</p>
          {/* Other character information */}
        </div>
      ))}
    </div>
  </div>
);
};

export default Characters;
