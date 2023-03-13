const API_URL = 'http://localhost:5100/api';

export async function fetchCharacters() {
  const response = await fetch(`${API_URL}/characters`);
  const data = await response.json();
  return data;
}

export async function createCharacter(newCharacter) {
  const formData = new FormData();
  formData.append('char_id', newCharacter.char_id);
  formData.append('char_name', newCharacter.char_name);
  formData.append('char_persona', newCharacter.char_persona);
  formData.append('world_scenario', newCharacter.world_scenario);
  formData.append('char_greeting', newCharacter.char_greeting);
  formData.append('example_dialogue', newCharacter.example_dialogue);
  formData.append('avatar', newCharacter.avatar);

  const response = await fetch(`${API_URL}/characters`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  return data.avatar;
}

export function getCharacterImageUrl(avatar) {
  return `${API_URL}/characters/images/${avatar}`;
}

export async function deleteCharacter(charId) {
  const response = await fetch(`${API_URL}/characters/${charId}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  return data;
}
