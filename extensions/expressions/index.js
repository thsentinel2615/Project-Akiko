const MODULE_NAME = 'expressions';
const DEFAULT_KEY = 'extensions_expressions_showDefault';
const UPDATE_INTERVAL = 1000;

let expressionsList = null;
let lastCharacter = undefined;
let lastMessage = null;
let inApiCall = false;
let showDefault = false;

async function urlContentToDataUri(url, params) {
    const response = await fetch(url, params);
    const blob = await response.blob();
    return await new Promise(callback => {
        let reader = new FileReader();
        reader.onload = function () { callback(this.result); };
        reader.readAsDataURL(blob);
    });
}

function loadSettings() {
    showDefault = localStorage.getItem(DEFAULT_KEY) == 'true';
    $('#expressions_show_default').prop('checked', showDefault).trigger('input');
}

function saveSettings() {
    localStorage.setItem(DEFAULT_KEY, showDefault.toString());
}

function onExpressionsShowDefaultInput() {
    const value = $(this).prop('checked');
    showDefault = value;
    saveSettings();

    const existingImage = $('div.expression').css('background-image');
    if (!value && existingImage.includes('data:image/png')) {
        $('div.expression').css('background-image', 'unset');
        lastMessage = null;
    }
    if (value) {
        lastMessage = null;
    }
}

const getContext = function () {
    return window['TavernAI'].getContext();
}

const getApiUrl = function () {
    return localStorage.getItem('extensions_url');
}

async function moduleWorker() {
    function getLastCharacterMessage() {
        const reversedChat = context.chat.slice().reverse();

        for (let mes of reversedChat) {
            if (mes.is_user || mes.is_system) {
                continue;
            }

            return mes.mes;
        }

        return '';
    }

    const context = getContext();

    // group chats and non-characters not supported
    if (context.groupId || !context.characterId) {
        removeExpression();
        return;
    }

    // character changed
    if (lastCharacter !== context.characterId) {
        removeExpression();
        validateImages();
    }

    // check if last message changed
    const currentLastMessage = getLastCharacterMessage();
    if (lastCharacter === context.characterId && lastMessage === currentLastMessage) {
        return;
    }

    // API is busy
    if (inApiCall) {
        return;
    }

    try {
        inApiCall = true;
        const url = new URL(getApiUrl());
        url.pathname = '/api/classify';

        const apiResult = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'bypass',
            },
            body: JSON.stringify({ text: currentLastMessage })
        });

        if (apiResult.ok) {
            const data = await apiResult.json();
            const expression = data.classification[0].label;
            setExpression(context.name2, expression);
        }

    }
    catch (error) {
        console.log(error);
    }
    finally {
        inApiCall = false;
        lastCharacter = context.characterId;
        lastMessage = currentLastMessage;
    }
}

function removeExpression() {
    lastMessage = null;
    $('div.expression').css('background-image', 'unset');
    $('.expression_settings').hide();
}

let imagesValidating = false;

async function validateImages() {
    if (imagesValidating) {
        return;
    }

    imagesValidating = true;
    const context = getContext();
    $('.expression_settings').show();
    $('#image_list').empty();

    if (!context.characterId) {
        return;
    }

    const IMAGE_LIST = (await getExpressionsList()).map(x => `${x}.png`);
    IMAGE_LIST.forEach((item) => {
        const image = document.createElement('img');
        image.src = `/characters/${context.name2}/${item}`;
        image.classList.add('debug-image');
        image.width = '0px';
        image.height = '0px';
        image.onload = function() {
            $('#image_list').append(`<li id="${item}" class="success">${item} - OK</li>`);
        }
        image.onerror = function() {
            $('#image_list').append(`<li id="${item}" class="failure">${item} - Missing</li>`);
        }
        $('#image_list').prepend(image);
    });
    imagesValidating = false;
}

async function getExpressionsList() {
    if (Array.isArray(expressionsList)) {
        return expressionsList;
    }

    const url = new URL(getApiUrl());
    url.pathname = '/api/classify/labels';

    try {
        const apiResult = await fetch(url, {
            method: 'GET',
            headers: { 'Bypass-Tunnel-Reminder': 'bypass' },
        });
    
        if (apiResult.ok) {
            const data = await apiResult.json();
            expressionsList = data.labels;
            return expressionsList;
        }
    }
    catch (error) {
        console.log(error);
        return [];
    }
}

async function setExpression(character, expression) {
    const filename = `${expression}.png`;
    const imgUrl = `url('/characters/${character}/${filename}')`;
    $('div.expression').css('background-image', imgUrl);

    const debugImageStatus = document.querySelector(`#image_list li[id="${filename}"]`);
    if (showDefault && debugImageStatus && debugImageStatus.classList.contains('failure')) {
        try {
            const imgUrl = new URL(getApiUrl());
            imgUrl.pathname = `/api/asset/${MODULE_NAME}/${filename}`;
            const dataUri = await urlContentToDataUri(imgUrl.toString(), { method: 'GET', headers: { 'Bypass-Tunnel-Reminder': 'bypass' } });
            $('div.expression').css('background-image', `url(${dataUri})`);
        } 
        catch {
            $('div.expression').css('background-image', 'unset');
        }
    }
}

(function () {
    function addExpressionImage() {
        const html = `<div class="expression"></div>`
        $('body').append(html);
    }
    function addSettings() {
        const html = `
        <div class="expression_settings">
            <h4>Expression images</h4>
            <ul id="image_list"></ul>
            <p><b>Hint:</b> <i>Put images into the <tt>public/characters/Name</tt>
            folder of TavernAI, where Name is the name of the character</i></p>
            <label for="expressions_show_default"><input id="expressions_show_default" type="checkbox">Show default images (emojis) if missing</label>
        </div>
        `;
        $('#extensions_settings').append(html);
        $('#expressions_show_default').on('input', onExpressionsShowDefaultInput);
        $('.expression_settings').hide();
    }

    addExpressionImage();
    addSettings();
    loadSettings();
    setInterval(moduleWorker, UPDATE_INTERVAL);
})();