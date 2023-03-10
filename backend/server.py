from functools import wraps
from flask import Flask, jsonify, request, render_template_string, abort, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import markdown
import argparse
from transformers import AutoTokenizer, AutoProcessor, pipeline
from transformers import AutoModelForCausalLM, AutoModelForSeq2SeqLM
from transformers import BlipForConditionalGeneration, GPT2Tokenizer
import unicodedata
import torch
import time
from glob import glob
import json
import os
from PIL import Image
import base64
from io import BytesIO
from random import randint
from colorama import Fore, Style, init as colorama_init
from werkzeug.utils import secure_filename

colorama_init()

# Constants
# Also try: 'Qiliang/bart-large-cnn-samsum-ElectrifAi_v10'
DEFAULT_SUMMARIZATION_MODEL = 'Qiliang/bart-large-cnn-samsum-ChatGPT_v3'
# Also try: 'joeddav/distilbert-base-uncased-go-emotions-student'
DEFAULT_CLASSIFICATION_MODEL = 'bhadresh-savani/distilbert-base-uncased-emotion'
# Also try: 'Salesforce/blip-image-captioning-base' or 'microsoft/git-large-r-textcaps'
DEFAULT_CAPTIONING_MODEL = 'Salesforce/blip-image-captioning-large'
DEFAULT_KEYPHRASE_MODEL = 'ml6team/keyphrase-extraction-distilbert-inspec'
DEFAULT_TEXT_MODEL = 'PygmalionAI/pygmalion-6b'

#ALL_MODULES = ['caption', 'summarize', 'classify', 'keywords', 'prompt', 'text', 'sd']
DEFAULT_SUMMARIZE_PARAMS = {
    'temperature': 1.0,
    'repetition_penalty': 1.0,
    'max_length': 500,
    'min_length': 200,
    'length_penalty': 1.5,
    'bad_words': ["\n", '"', "*", "[", "]", "{", "}", ":", "(", ")", "<", ">", "Â"]
}
DEFAULT_TEXT_PARAMS = {
    'do_sample': True,
    'max_length':2048,
    'use_cache':True,
    'min_new_tokens':10,
    'temperature':0.71,
    'repetition_penalty':1.01,
    'top_p':0.9,
    'top_k':40,
    'typical_p':1,
    'repetition_penalty': 1,
    'num_beams': 1,
    'penalty_alpha': 0,
    'length_penalty': 1,
    'no_repeat_ngram_size': 0,
    'early_stopping': False,
}
class SplitArgs(argparse.Action):
    def __call__(self, parser, namespace, values, option_string=None):
        setattr(namespace, self.dest, values.replace('"', '').replace("'", '').split(','))

# Script arguments
parser = argparse.ArgumentParser(
    prog='TavernAI Extras', description='Web API for transformers models')
parser.add_argument('--port', type=int,
                    help="Specify the port on which the application is hosted")
parser.add_argument('--listen', action='store_true',
                    help="Host the app on the local network")
parser.add_argument('--share', action='store_true',
                    help="Share the app on CloudFlare tunnel")
parser.add_argument('--cpu', action='store_true',
                    help="Run the models on the CPU")
parser.add_argument('--summarization-model',
                    help="Load a custom summarization model")
parser.add_argument('--classification-model',
                    help="Load a custom text classification model")
parser.add_argument('--captioning-model',
                    help="Load a custom captioning model")
parser.add_argument('--keyphrase-model',
                    help="Load a custom keyphrase extraction model")
parser.add_argument('--sd-cpu',
                    help="Force the SD pipeline to run on the CPU")
parser.add_argument('--text-model',
                    help="Load a custom text generation model")
parser.add_argument('--enable-modules', action=SplitArgs, default=[],
                    help="Override a list of enabled modules")

args = parser.parse_args()

port = args.port if args.port else 5100
host = '0.0.0.0' if args.listen else 'localhost'
summarization_model = args.summarization_model if args.summarization_model else DEFAULT_SUMMARIZATION_MODEL
classification_model = args.classification_model if args.classification_model else DEFAULT_CLASSIFICATION_MODEL
captioning_model = args.captioning_model if args.captioning_model else DEFAULT_CAPTIONING_MODEL
keyphrase_model = args.keyphrase_model if args.keyphrase_model else DEFAULT_KEYPHRASE_MODEL
text_model = args.text_model if args.text_model else DEFAULT_TEXT_MODEL
modules = args.enable_modules if args.enable_modules and len(args.enable_modules) > 0 else []

if len(modules) == 0:
    print(f'{Fore.RED}{Style.BRIGHT}You did not select any modules to run! Choose them by adding an --enable-modules option')
    print(f'Example: --enable-modules=caption,summarize{Style.RESET_ALL}')

# Models init
device_string = "cuda:0" if torch.cuda.is_available() and not args.cpu else "cpu"
device = torch.device(device_string)
torch_dtype = torch.float32 if device_string == "cpu" else torch.float16

if 'caption' in modules:
    print('Initializing an image captioning model...')
    captioning_processor = AutoProcessor.from_pretrained(captioning_model)
    if 'blip' in captioning_model:
        captioning_transformer = BlipForConditionalGeneration.from_pretrained(captioning_model, torch_dtype=torch_dtype).to(device)
    else:
        captioning_transformer = AutoModelForCausalLM.from_pretrained(captioning_model, torch_dtype=torch_dtype).to(device)

if 'summarize' in modules:
    print('Initializing a text summarization model...')
    summarization_tokenizer = AutoTokenizer.from_pretrained(summarization_model)
    summarization_transformer = AutoModelForSeq2SeqLM.from_pretrained(summarization_model, torch_dtype=torch_dtype).to(device)

if 'classify' in modules:
    print('Initializing a sentiment classification pipeline...')
    classification_pipe = pipeline("text-classification", model=classification_model, top_k=None, device=device, torch_dtype=torch_dtype)

if 'keywords' in modules:
    print('Initializing a keyword extraction pipeline...')
    import pipelines as pipelines
    keyphrase_pipe = pipelines.KeyphraseExtractionPipeline(keyphrase_model)

if 'text' in modules:
    print('Initializing a text generator')
    text_tokenizer = AutoTokenizer.from_pretrained(text_model)
    text_transformer = AutoModelForCausalLM.from_pretrained(text_model, torch_dtype=torch.float16).to(device)

# Flask init
app = Flask(__name__)
CORS(app) # allow cross-domain requests
socketio = SocketIO(app)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
# Folder Locations
app.config['CHARACTER_FOLDER'] = '../shared_data/character_info/'
app.config['CHARACTER_IMAGES_FOLDER'] = '../shared_data/character_images/'
app.config['DEBUG'] = True
app.config['PROPAGATE_EXCEPTIONS'] = False

socketio = SocketIO(cors_allowed_origins="*")

extensions = []

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def require_module(name):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if name not in modules:
                abort(403, 'Module is disabled by config')
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper


def load_extensions():
    for match in glob("./extensions/*/"):
        manifest_path = os.path.join(match, 'manifest.json')
        if os.path.exists(manifest_path):
            name = os.path.basename(os.path.normpath(match))
            with open(manifest_path, 'r') as f:
                manifest_content = f.read()
            manifest = json.loads(manifest_content)
            if set(manifest['requires']).issubset(set(modules)):
                extensions.append({'name': name, 'metadata': manifest})


# AI stuff
def classify_text(text: str) -> list:
    output = classification_pipe(text)[0]
    return sorted(output, key=lambda x: x['score'], reverse=True)


def caption_image(raw_image: Image, max_new_tokens: int = 20) -> str:
    inputs = captioning_processor(raw_image.convert('RGB'), return_tensors="pt").to(device, torch_dtype)
    outputs = captioning_transformer.generate(**inputs, max_new_tokens=max_new_tokens)
    caption = captioning_processor.decode(outputs[0], skip_special_tokens=True)
    return caption


def summarize(text: str, params: dict) -> str:
    # Tokenize input
    inputs = summarization_tokenizer(text, return_tensors="pt").to(device)
    token_count = len(inputs[0])

    bad_words_ids = [
        summarization_tokenizer(bad_word, add_special_tokens=False).input_ids
        for bad_word in params['bad_words']
    ]
    summary_ids = summarization_transformer.generate(
        inputs["input_ids"],
        num_beams=2,
        min_length=min(token_count, int(params['min_length'])),
        max_length=max(token_count, int(params['max_length'])),
        repetition_penalty=float(params['repetition_penalty']),
        temperature=float(params['temperature']),
        length_penalty=float(params['length_penalty']),
        bad_words_ids=bad_words_ids,
    )
    summary = summarization_tokenizer.batch_decode(
        summary_ids, skip_special_tokens=True, clean_up_tokenization_spaces=True
    )[0]
    summary = normalize_string(summary)
    return summary


def normalize_string(input: str) -> str:
    output = " ".join(unicodedata.normalize("NFKC", input).strip().split())
    return output


def extract_keywords(text: str) -> list:
    punctuation = '(){}[]\n\r<>'
    trans = str.maketrans(punctuation, ' '*len(punctuation))
    text = text.translate(trans)
    text = normalize_string(text)
    return list(keyphrase_pipe(text))

def generate_text(prompt: str, settings: dict) -> str:
    input_ids = text_tokenizer.encode(prompt, return_tensors="pt").to(device)
    attention_mask = torch.ones_like(input_ids)
    output = text_transformer.generate(
        input_ids,
        max_length=int(settings['max_length']),
        do_sample=settings['do_sample'],
        use_cache=settings['use_cache'],
        typical_p=float(settings['typical_p']),
        penalty_alpha=float(settings['penalty_alpha']),
        min_new_tokens=int(settings['min_new_tokens']),
        temperature=float(settings['temperature']),
        length_penalty=float(settings['length_penalty']),
        early_stopping=settings['early_stopping'],
        repetition_penalty=float(settings['repetition_penalty']),
        num_beams=int(settings['num_beams']),
        top_p=float(settings['top_p']),
        top_k=int(settings['top_k']),
        no_repeat_ngram_size=float(settings['no_repeat_ngram_size']),
        attention_mask=attention_mask,
        pad_token_id=text_tokenizer.pad_token_id,
        )
    if output is not None:
        generated_text = text_tokenizer.decode(output[0], skip_special_tokens=True)
        prompt_lines  = [line.strip() for line in str(prompt).split("\n")]
        response_lines  = [line.strip() for line in str(generated_text).split("\n")]
        new_amt = (len(response_lines) - len(prompt_lines)) + 1
        closest_lines = response_lines[-new_amt:]
        last_line = prompt_lines[-1]
        if last_line:
            last_line_words = last_line.split()
            if len(last_line_words) > 0:
                filter_word = last_line_words[0]
                closest_lines[0] = closest_lines[0].replace(filter_word, '', 1).lstrip()
                result_text = "\n".join(closest_lines)
        results = {"text" : result_text}
        return results
    else:
        return {'text': "This is an empty message. Something went wrong. Please check your code!"}

@app.before_request
# Request time measuring
def before_request():
    request.start_time = time.time()


@app.after_request
def after_request(response):
    duration = time.time() - request.start_time
    response.headers['X-Request-Duration'] = str(duration)
    return response


@app.route('/', methods=['GET'])
def index():
    with open('./README.md', 'r') as f:
        content = f.read()
    return render_template_string(markdown.markdown(content, extensions=['tables']))

@app.errorhandler(400)
def handle_bad_request(e):
    return jsonify(error=str(e)), 400

@app.route('/api/caption', methods=['POST'])
@require_module('caption')
def api_caption():
    data = request.get_json()

    if 'image' not in data or not isinstance(data['image'], str):
        abort(400, '"image" is required')

    image = Image.open(BytesIO(base64.b64decode(data['image'])))
    caption = caption_image(image)
    return jsonify({'caption': caption})


@app.route('/api/summarize', methods=['POST'])
@require_module('summarize')
def api_summarize():
    data = request.get_json()

    if 'text' not in data or not isinstance(data['text'], str):
        abort(400, '"text" is required')

    params = DEFAULT_SUMMARIZE_PARAMS.copy()

    if 'params' in data and isinstance(data['params'], dict):
        params.update(data['params'])

    summary = summarize(data['text'], params)
    return jsonify({'summary': summary})


@app.route('/api/classify', methods=['POST'])
@require_module('classify')
def api_classify():
    data = request.get_json()

    if 'text' not in data or not isinstance(data['text'], str):
        abort(400, '"text" is required')

    classification = classify_text(data['text'])
    return jsonify({'classification': classification})


@app.route('/api/classify/labels', methods=['GET'])
@require_module('classify')
def api_classify_labels():
    classification = classify_text('')
    labels = [x['label'] for x in classification]
    return jsonify({'labels': labels})


@app.route('/api/keywords', methods=['POST'])
@require_module('keywords')
def api_keywords():
    data = request.get_json()

    if 'text' not in data or not isinstance(data['text'], str):
        abort(400, '"text" is required')

    keywords = extract_keywords(data['text'])
    return jsonify({'keywords': keywords})


@app.route('/api/text', methods=['POST'])
@require_module('text')
def api_text():
    data = request.get_json()
    if 'prompt' not in data or not isinstance(data['prompt'], str):
        abort(400, '"prompt" is required')

    settings = DEFAULT_TEXT_PARAMS.copy()

    if 'settings' in data and isinstance(data['settings'], dict):
        settings.update(data['settings'])
    
    prompt = data['prompt']
    results = {'results': [generate_text(prompt, settings)]}
    return jsonify(results)


@app.route('/api/characters/images/<filename>', methods=['GET'])
def get_avatar_image(filename):
    try:
        return send_from_directory(app.config['CHARACTER_IMAGES_FOLDER'], filename, as_attachment=True)
    except FileNotFoundError:
        abort(404)

@app.route('/api/characters', methods=['GET'])
def get_characters():
    characters = []
    # loop through all the character files and load the data
    for filename in os.listdir(app.config['CHARACTER_FOLDER']):
        if filename.endswith('.json'):
            with open(os.path.join(app.config['CHARACTER_FOLDER'], filename)) as f:
                character_data = json.load(f)
                characters.append(character_data)
    # return the list of characters as a JSON response
    return jsonify(characters)

@app.route('/api/characters', methods=['POST'])
def add_character():
    # Get the character information from the request
    char_id = request.form.get('char_id')
    name = request.form.get('char_name')
    description = request.form.get('char_persona')
    scenario = request.form.get('world_scenario')
    greeting = request.form.get('char_greeting')
    examples = request.form.get('example_dialogue')
    avatar = request.files['avatar']
    # Check if a file was uploaded and if it's allowed
    if avatar and allowed_file(avatar.filename):
        # Save the file with a secure filename
        filename = secure_filename(str(char_id) + '.png')
        avatar.save(os.path.join(app.config['CHARACTER_IMAGES_FOLDER'], filename))
        # Add the file path to the character information
        avatar = filename
    # Save the character information to a JSON file
    character = {
        'char_id': char_id,
        'char_name': name,
        'char_persona': description,
        'world_scenario': scenario,
        'char_greeting': greeting,
        'example_dialogue': examples,
        'avatar': avatar
    }
    with open(app.config['CHARACTER_FOLDER']+str(char_id)+'.json', 'a') as f:
        f.write(json.dumps(character))
    return jsonify({'message': 'Character added successfully', 'avatar': avatar})

@app.route('/api/characters/<int:char_id>', methods=['DELETE'])
def delete_character(char_id):
    character_path = app.config['CHARACTER_FOLDER'] + str(char_id) + '.json'
    image_path = app.config['CHARACTER_IMAGES_FOLDER'] + str(char_id) + '.png'
    try:
        os.remove(character_path)
        os.remove(image_path)
    except FileNotFoundError:
        return jsonify({'error': 'Character not found'}), 404
    return jsonify({'message': 'Character deleted successfully'})

@app.route('/api/characters/<int:char_id>', methods=['PUT'])
def update_character(char_id):
    # Get the character information from the request
    name = request.form.get('char_name')
    description = request.form.get('char_persona')
    scenario = request.form.get('world_scenario')
    greeting = request.form.get('char_greeting')
    examples = request.form.get('example_dialogue')
    avatar = request.files.get('avatar')
    # Check if a file was uploaded and if it's allowed
    if avatar and allowed_file(avatar.filename):
        # Save the file with a secure filename
        filename = secure_filename(str(char_id) + '.png')
        avatar.save(os.path.join(app.config['CHARACTER_IMAGES_FOLDER'], filename))
        # Add the file path to the character information
        avatar = filename
    # Load the existing character information from the JSON file
    character_path = app.config['CHARACTER_FOLDER'] + str(char_id) + '.json'
    try:
        with open(character_path, 'r') as f:
            character = json.load(f)
    except FileNotFoundError:
        return jsonify({'error': 'Character not found'}), 404
    # Update the character information
    character['char_name'] = name
    character['char_persona'] = description
    character['world_scenario'] = scenario
    character['char_greeting'] = greeting
    character['example_dialogue'] = examples
    if avatar:
        character['avatar'] = avatar
    # Save the updated character information to the JSON file
    with open(character_path, 'w') as f:
        json.dump(character, f)
    return jsonify({'message': 'Character updated successfully'})

@socketio.on('add_character')
def add_character(data):
    char_id = data['char_id']
    name = data['name']
    description = data['description']
    scenario = data['scenario']
    greeting = data['greeting']
    examples = data['examples']
    avatar = data['avatar']

    if avatar:
        # Save the file with a secure filename
        filename = secure_filename(name + '.png')
        avatar.save(os.path.join(app.config['CHARACTER_IMAGES_FOLDER'], filename))

        # Add the file path to the character information
        avatar = filename

    # Save the character information to a JSON file
    character = {
        'char_id': char_id,
        'char_name': name,
        'char_persona': description,
        'world_scenario': scenario,
        'char_greeting': greeting,
        'example_dialogue': examples,
        'avatar': avatar
    }
    with open(app.config['CHARACTER_FOLDER']+name+'.json', 'a') as f:
        f.write(json.dumps(character))

    # Emit the new character data to all the clients
    socketio.emit('characters_updated', {'message': 'Character added'}, broadcast=True)

if args.share:
    from flask_cloudflared import _run_cloudflared
    import inspect
    sig = inspect.signature(_run_cloudflared)
    sum = sum(1 for param in sig.parameters.values() if param.kind == param.POSITIONAL_OR_KEYWORD)
    if sum > 1:
        metrics_port = randint(8100, 9000)
        cloudflare = _run_cloudflared(port, metrics_port)
    else:
        cloudflare = _run_cloudflared(port)
    print("Running on", cloudflare)

load_extensions()
app.run(host=host, port=port)
