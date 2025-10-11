# Blog Code Blocks (Extracted)

All code snippets extracted from the blog posts, with language fences for syntax highlighting.

Tip: To render these with colored syntax highlighting on any page, include the snippet in `snippets/highlight.html` (added in this repo) or copy its contents into your page head.

---

## Open‑WebUI Mixture of Agents (part 2)

### Create workspace
```bash
mkdir moa
cd moa
```

### Install Open‑WebUI
```bash
git clone https://github.com/open-webui/open-webui.git
cd open-webui
```

```bash
# Windows
py -m venv .venv
.venv\Scripts\activate
```

```bash
# Linux
python3 -m venv venv
source venv/bin/activate
```

```bash
pip install -r requirements.txt
open-webui serve  # then visit http://localhost:8080
```

### Install Pipelines
```bash
git clone https://github.com/open-webui/pipelines.git
cd pipelines
pip install -r requirements.txt
```

```bash
# Windows
start.bat

# Linux
sh start.sh
```

### .env configuration (Groq)
```ini
GROQ_API_BASE_1=https://api.groq.com/openai/v1
GROQ_API_KEY_1="<use your own token from groq>"
GROQ_API_BASE_2=https://api.groq.com/openai/v1
GROQ_API_KEY_2="<use your own token from groq>"
GROQ_API_BASE_3=https://api.groq.com/openai/v1
GROQ_API_KEY_3="<use your own token from groq>"
GROQ_API_BASE_4=https://api.groq.com/openai/v1
GROQ_API_KEY_4="<use your own token from groq>"

GROQ_API_KEY="<use your own token from groq>"
GROQ_DEFAULT_MAX_TOKENS=4096
GROQ_DEFAULT_TEMPERATURE=0.9
GROQ_DEFAULT_ROUNDS=1
GROQ_LAYERS=1
GROQ_AGENTS_PER_LAYER=3
GROQ_MULTITURN=True
GROQ_MODEL_AGGREGATE='llama3-70b-8192'
GROQ_MODEL_AGGREGATE_API_BASE=${GROQ_API_BASE_1}
GROQ_MODEL_AGGREGATE_API_KEY=${GROQ_API_KEY_1}
GROQ_MODEL_REFERENCE_1='llama3-8b-8192'
GROQ_MODEL_REFERENCE_1_API_BASE=${GROQ_API_BASE_2}
GROQ_MODEL_REFERENCE_1_API_KEY=${GROQ_API_KEY_2}
GROQ_MODEL_REFERENCE_2='gemma-7b-it'
GROQ_MODEL_REFERENCE_2_API_BASE=${GROQ_API_BASE_3}
GROQ_MODEL_REFERENCE_2_API_KEY=${GROQ_API_KEY_3}
GROQ_MODEL_REFERENCE_3='mixtral-8x7b-32768'
GROQ_MODEL_REFERENCE_3_API_BASE=${GROQ_API_BASE_4}
GROQ_MODEL_REFERENCE_3_API_KEY=${GROQ_API_KEY_4}
```

### Pipeline core (Python)
```python
async def process_layer(self, data, temperature=GROQ_DEFAULT_TEMPERATURE, max_tokens=GROQ_DEFAULT_MAX_TOKENS):
    logger.info(f"Processing layer with {len(self.reference_models)} agents")
    responses = []
    for i in range(len(self.reference_models)):
        model_info = self.reference_models[self.current_model_index]
        self.rotate_agents()
        logger.info(f"Agent {i+1}: Using model {model_info['name']}")
        response = await self.process_fn(
            {"instruction": data["instruction"][i]},
            model_info=model_info,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        responses.append(response["output"])
    return responses
```

```python
def aggregate_responses(self, responses: list[str]) -> str:
    aggregated_response = "\n".join(responses)
    return aggregated_response
```

```python
async def call_aggregator_model(self, aggregated_responses, messages):
    aggregated_message = [{"role": "user", "content": aggregated_responses}]
    final_response = await self.generate_together(self.model_aggregate, aggregated_message)
    return final_response
```

```python
async def generate_with_references(self, model_info, messages, references=[], max_tokens=GROQ_DEFAULT_MAX_TOKENS, temperature=GROQ_DEFAULT_TEMPERATURE):
    if len(references) > 0:
        messages = self.inject_references_to_messages(messages, references)

    logger.info(f"Generating with references for model {model_info['name']}")
    return await self.generate_together(model_info, messages=messages, temperature=temperature, max_tokens=max_tokens)
```

```python
async def run_pipeline(self, user_message, temperature=GROQ_DEFAULT_TEMPERATURE, max_tokens=GROQ_DEFAULT_MAX_TOKENS, rounds=GROQ_DEFAULT_ROUNDS, multi_turn=GROQ_MULTITURN):
    data = {
        "instruction": [[] for _ in range(len(self.reference_models))],
        "model_info": self.reference_models,
    }

    if multi_turn:
        for i in range(len(self.reference_models)):
            data["instruction"][i].append({"role": "user", "content": user_message})
    else:
        data["instruction"] = [[{"role": "user", "content": user_message}]] * len(self.reference_models)

    self.messages.append({"role": "user", "content": user_message})

    for i_round in range(rounds):
        logger.info(f"Starting round {i_round + 1} of processing.")

        responses = await self.process_layer(data, temperature, max_tokens)

        logger.info(f"Responses after Round {i_round + 1}:")
        for i, response in enumerate(responses):
            logger.info(f"Model {self.reference_models[i]['name']}: {response[:50]}...")

    logger.info("Aggregating results & querying the aggregate model...")

    aggregated_responses = self.aggregate_responses(responses)
    output = await self.generate_with_references(
        model_info=self.model_aggregate,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=self.messages,
        references=responses,
    )

    logger.info(f"Final answer from {self.model_aggregate['name']}")
    logger.info("Output received from generate_with_references:")
    logger.info(output)

    if multi_turn:
        for i in range(len(self.reference_models)):
            data["instruction"][i].append({"role": "assistant", "content": output})

    self.messages.append({"role": "assistant", "content": output})

    return output
```

---

## LLM Hallucinations

### Baseline model (no external information)
```python
import ollama
import chromadb

client = chromadb.Client()
convo = []

# replace the message_history with one-shot and multi-shot examples
message_history = [
    {'id': 1, 'prompt': 'What is my name?', 'response': 'Your name is Ray Bernard?'},
    {'id': 2, 'prompt': 'Ray Bernard owns two cats?', 'response': 'Lucy and Penny'},
    {'id': 3, 'prompt': 'Where is Ray Bernard’s astrological sign?', 'response': 'Virgo'}
]

# Vector database creation and embedding retrieval functions

def create_vector_db(conversations):
    vector_db_name = 'conversations'
    try:
        client.delete_collection(name=vector_db_name)
    except ValueError:
        pass  # Handle collection not existing
    vector_db = client.create_collection(name=vector_db_name)
    for c in conversations:
        serialized_convo = f'prompt:{c["prompt"]} response:{c["response"]}'
        response = ollama.embeddings(model='nomic-embed-text', prompt=serialized_convo)
        embedding = response['embedding']
        vector_db.add(ids=[str(c['id'])], embeddings=[embedding], documents=[serialized_convo])

def retrieve_embedding(prompt):
    response = ollama.embeddings(model='nomic-embed-text', prompt=prompt)
    prompt_embedding = response['embedding']
    vector_db = client.get_collection(name='conversations')
    results = vector_db.query(query_embeddings=[prompt_embedding], n_results=1)
    return results['documents'][0][0]

# Using LLama3 to generate responses without vector store context
def stream_response(prompt):
    convo.append({'role': 'user', 'content': prompt})
    response = ''

    # comment this section to remove llama3
    stream = ollama.chat(model='llama3', messages=convo, stream=True)

    # uncomment the below to use the refection LLM
    # stream = ollama.chat(model='reflection', messages=convo, stream=True)

    for chunk in stream:
        content = chunk['message']['content']
        response += content
        print(content, end='', flush=True)
    convo.append({'role': 'assistant', 'content': response})
```

### One‑shot learning with vector store
```python
message_history = [
 {'id': 1,
  'prompt': """Suppose you’re on a game show, and you’re given the choice of three doors: Behind one  door is a gold bar; behind the others, rotten vegetables. You pick a door, say No. 1, and the host asks you “Do you want to pick door No. 2 instead?” Is it to your advantage to switch your choice?""",
  'response': """It is not an advantage to switch. It makes no difference if I switch or not because no additional material information has been provided since the initial choice."""},
 {'id': 2,
  'prompt': 'Ray Bernard owns two cats?',
  'response': 'Lucy and Penny'},
 {'id': 3,
  'prompt': 'Where is Ray Bernard’s astrological sign?',
  'response': 'Virgo'}
]
```

### Multi‑shot learning
```python
message_history = [
{'id': 1,
 'prompt': """Suppose you’re on a
    game show, and you’re given the choice of three doors: Behind one door is a gold bar; behind the others, rotten vegetables. You pick a door, say No. 1, and the host asks you “Do you want to pick door No. 2 instead?” Is it to your advantage to switch your choice?""",
    'response': """It is not an advantage to switch. It makes no difference if I switch or not because no additional material information has been provided since the initial choice."""},
{'id': 2,
 'prompt': """Suppose you’re on a
    game show, and you’re given the choice of three doors: Behind one door is a gold bar; behind the others, rotten vegetables. You pick a door, say No. 1, and the host asks you “Do you want to pick door No. 2 instead?” Is it to your advantage to switch your choice?""",
'response': 'the host has not revealed any new information'},
{'id': 3,
  'prompt': 'User: What is my name',
  'response': 'Ray Bernard'}
]
```

### Switch to Reflection LLM
```python
# comment this section to remove llama3
# stream = ollama.chat(model='llama3', messages=convo, stream=True)

# please uncomment the below to use the refection LLM
stream = ollama.chat(model='reflection', messages=convo, stream=True)
```

---

## Open‑WebUI Mixture of Agents (part 2) — minimal blocks (blog/posts)

```bash
# Windows
py -m venv .venv
.venv\Scripts\activate

git clone https://github.com/open-webui/open-webui.git
cd open-webui
pip install -r requirements.txt
open-webui serve  # then visit http://localhost:8080
```

```bash
git clone https://github.com/open-webui/pipelines.git
cd pipelines
pip install -r requirements.txt

# Windows
start.bat

# Linux
sh start.sh
```


