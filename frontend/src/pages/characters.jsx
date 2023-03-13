import React, { useState, useEffect } from "react";
import { fetchCharacters, getCharacterImageUrl, deleteCharacter, createCharacter, updateCharacter } from "../assets/components/Api";
import { CharacterForm } from "../assets/components/CharacterForm";
import { UpdateCharacterForm } from "../assets/components/UpdateCharacterForm";

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

  function editCharacter(updatedCharacter) {
    updateCharacter(updatedCharacter)
      .then(() => {
        setCharacters(characters.map((c) => c.char_id === updatedCharacter.char_id ? updatedCharacter : c));
        closeModal();
        window.location.reload()
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
            {character.avatar && <img src={getCharacterImageUrl(character.avatar)} alt={character.char_name} id="character-avatar" onClick={() => openModal(character)} />}
            <button id="character-close" onClick={() => delCharacter(character.char_id)}><b>Delete Character</b></button>
            <button id="character-submit" onClick={() => openModal(character)}><b>Character Details</b></button>
          </div>
        ))}
      </div>
      {selectedCharacter && (
        <UpdateCharacterForm
          character={selectedCharacter}
          onUpdateCharacter={editCharacter}
          onClose={() => closeModal()}
        />
      )}
    </div>
  );
};

export default Characters;