import React, { useState, useEffect } from "react";
import { fetchCharacters, getCharacterImageUrl, deleteCharacter, createCharacter } from "../assets/components/Api";
import { CharacterForm } from "../assets/components/CharacterForm";

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  useEffect(() => {
    fetchCharacters()
      .then(data => setCharacters(data))
      .catch(error => {
        console.error(error);
        history.push('/error');
      });
  }, []);

  const openModal = (character) => {
    setSelectedCharacter(character);
  }

  const closeModal = () => {
    setSelectedCharacter(null);
  }

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
  const delCharacter = async (charId) => {
    try {
      deleteCharacter(charId)
      setCharacters(characters.filter((c) => c.char_id !== charId));
      closeModal();
    } catch (error) {
      console.error(error);
    }
  };

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
            {character.avatar && <img src={getCharacterImageUrl(character.avatar)} alt={character.char_name} id="character-avatar"onClick={() => openModal(character)}/>}
            <button id="character-button"onClick={() => openModal(character)}><b>Character Details</b></button>
          </div>
        ))}
      </div>
      {selectedCharacter && (
        <div className="modal-overlay">
          <div className="character-form">
            <span className="close" onClick={() => closeModal()}>&times;</span>
            <h2>{selectedCharacter.char_name}</h2>
            {selectedCharacter.avatar && <img src={getCharacterImageUrl(selectedCharacter.avatar)} alt={selectedCharacter.char_name} id="character-avatar"/>}
            <div className="character-input">
              <label><b>Description:</b></label>
              <p> {selectedCharacter.char_persona}</p>
              <label><b>Scenario:</b></label>
              <p>{selectedCharacter.world_scenario}</p>
              <label><b>Greeting:</b></label>
              <p>{selectedCharacter.char_greeting}</p>
              <label><b>Example Dialogue:</b></label>
              <p>{selectedCharacter.example_dialogue}</p>
              <button id="character-close" onClick={() => delCharacter(selectedCharacter.char_id)}><b>Delete Character</b></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Characters;
