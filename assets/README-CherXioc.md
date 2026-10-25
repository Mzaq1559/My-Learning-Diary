---
title: Running My First Local AI Agent — Hugging Face smolagents with Ollama and Qwen2.5
slug: local-huggingface-agent-ollama-qwen
date: 2026-10-25
excerpt: My hands-on setup diary for the Hugging Face Agents course: wrestling with Ollama on Ubuntu, getting Qwen2.5:1.5b running locally, wiring up smolagents and LiteLLM, and finally seeing my first agent return 360.
tags: [Hugging Face, Agents, smolagents, Ollama, Qwen, LLM, Python, Linux, Local AI, Learning Diary]
category: Learning Log
cover: ./images/cover.png
---

# Running My First Local AI Agent — Hugging Face smolagents with Ollama and Qwen2.5

I started this because I wanted to work through the Hugging Face Agents course and run the model on my own laptop instead of immediately depending on a hosted API. My plan sounded straightforward: install Ollama, download a small model, make a Python environment, connect the model to smolagents, and run a tiny task to see the whole thing working.

The actual setup took longer than the Python script. I hit a Snap permission problem, downloads that kept failing, and a locally installed Ollama server that could answer API requests but couldn't load its own inference backend. I'm keeping those parts in this post too, because they're what I actually had to work through to get to the first successful run.

## What I was working with

My course project is here:

~~~text
~/Desktop/Coding/Projects/hf-agents
~~~

I'm on Ubuntu, using a CPU-only laptop with 8 GB of RAM. I picked qwen2.5:1.5b because I wanted a small local model to experiment with before trying anything bigger.

The pieces of the setup are:

- **Ollama** — runs the model and exposes a local HTTP API.
- **Qwen2.5:1.5b** — the model I'm running locally.
- **Python virtual environment** — keeps the course packages isolated.
- **smolagents** — the Hugging Face agent framework.
- **LiteLLM** — connects the agent framework to Ollama's chat API.

## 1. The Snap install didn't work for me

My first attempt was the obvious one:

~~~bash
sudo snap install ollama
~~~

The package showed as active when I checked the Snap services, but running the model didn't work: Ollama hit a permission-denied error involving its local API socket at 127.0.0.1:11434. Having a service marked as active didn't mean I could successfully use it from the CLI.

![Initial Ollama Snap installation and permission error](./images/1.png)

I checked the API directly rather than guessing whether the server was alive:

~~~bash
curl http://127.0.0.1:11434/api/version
curl http://127.0.0.1:11434/api/tags
~~~

The endpoints responded, reporting Ollama version 0.40.2, but /api/tags returned an empty model list. So at that point, there wasn't a model downloaded locally either.

![Checking Ollama API version and model list with curl](./images/2.png)

I decided to remove the Snap installation and try another route:

~~~bash
sudo snap remove ollama
~~~

## 2. The installer download kept failing

Next I tried Ollama's install script. The download failed with an HTTP/2 protocol stream error, and the archive extraction then complained about an unexpected end of file. I tried forcing HTTP/1.1 as a workaround, but the download route still wasn't something I wanted to keep blindly retrying.

![Removing Snap and encountering the Ollama installer download error](./images/3.png)

![Retrying the installer with HTTP/1.1](./images/4.png)

I ended up working with the Linux files I had downloaded and manually placing the Ollama binary and its supporting libraries. That got me further, but it also left me needing to pay attention to which binary I was actually running and where its companion files lived. I had both /usr/bin/ollama and /usr/local/bin/ollama on the machine, so from then on I used explicit paths in commands to avoid mixing them up.

Once I could start the server, it listened on 127.0.0.1:11434. I left that terminal running and used a second terminal for the model commands.

![Ollama server running and listening on the local API port](./images/5.png)

## 3. Downloading and testing Qwen

With the server running, I pulled the model:

~~~bash
/usr/local/bin/ollama pull qwen2.5:1.5b
~~~

The download was roughly 986 MB. I waited for it to finish before involving Python, because I wanted to know whether the model itself could run independently first.

![Pulling the Qwen2.5:1.5b model](./images/6.png)

I also tested it directly in the terminal:

~~~bash
/usr/local/bin/ollama run qwen2.5:1.5b
~~~

That gave me a basic checkpoint: I could interact with Qwen through Ollama before introducing LiteLLM or an agent loop.

![Testing Qwen2.5 interactively from the terminal](./images/8.png)

## 4. Setting up the course's Python environment

After that, I moved to the course project and created a virtual environment:

~~~bash
cd ~/Desktop/Coding/Projects/hf-agents
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install "smolagents[litellm]"
~~~

The .venv prefix in my terminal prompt showed that the environment was active. Installing the litellm extra with smolagents gave me the model integration I needed for this example.

![Creating the virtual environment and installing smolagents with LiteLLM support](./images/7.png)

## 5. Writing my first agent

I created agent.py in the project directory. I kept the first task intentionally simple: ask for a multiplication and let the agent work it out.

~~~python
from smolagents import LiteLLMModel, CodeAgent

model = LiteLLMModel(
    model_id="ollama_chat/qwen2.5:1.5b",
    api_base="http://127.0.0.1:11434",
    num_ctx=4096,
)

agent = CodeAgent(
    tools=[],
    model=model,
)

result = agent.run("What is 15 multiplied by 24?")
print(result)
~~~

![Writing agent.py in the terminal editor](./images/9.png)

A couple of details connect the pieces:

- model_id="ollama_chat/qwen2.5:1.5b" tells LiteLLM to use the Ollama chat interface and the model I pulled.
- api_base="http://127.0.0.1:11434" points to the local Ollama API.
- num_ctx=4096 requests a context size of 4096 tokens.
- CodeAgent is the agent that can generate Python code and execute it as part of solving the task.

At this point the script was written, but I still needed the local server and its inference process to work reliably.

## 6. The first run wasn't the finish line

My first attempt to run python agent.py failed with a connection-refused error. LiteLLM couldn't reach 127.0.0.1:11434, because the Ollama server wasn't running when the script tried to connect. That was a useful reminder that installing Ollama and downloading a model doesn't automatically mean the API is running in the background: I needed to start ollama serve and leave it running in its own terminal.

![First agent.py run failing because the local Ollama API connection was refused](./images/10.png)

I started the server again and retried. The next error was different: Ollama complained that the llama-server binary couldn't be found. This was a lower-level issue than the Python code. Ollama uses that companion executable to load and run the model, and my manual installation hadn't put it where the running Ollama binary expected it.

I searched for the file and found it among the extracted Ollama libraries. I then created the expected directory and tried a symbolic link so the launcher could locate it.

![Searching for llama-server and creating a symbolic link to resolve the missing binary](./images/11.png)

That got the launcher to start, but there was still another problem. The server then failed while loading the model with this message:

~~~text
no backends are loaded
~~~

The CPU backend files existed, but the launcher wasn't discovering/loading them properly. I checked the library dependencies, confirmed that the CPU backend's shared-library dependencies could resolve, and compared the directories being used by the different Ollama binaries. The key was to start the Ollama binary with both the backend directory and its shared-library directory explicitly set.

The working command was:

~~~bash
OLLAMA_LIBRARY_PATH=/usr/lib/ollama \
LD_LIBRARY_PATH=/usr/lib/ollama \
/usr/local/bin/ollama serve
~~~

I kept that server terminal open. In another terminal, I tested the model directly:

~~~bash
/usr/local/bin/ollama run qwen2.5:1.5b "What is 15 multiplied by 24?"
~~~

It returned:

~~~text
15 multiplied by 24 is 360.
~~~

That was the first clear sign that the model-loading problem was resolved. I hadn't changed the Python agent to work around it; I had fixed the local Ollama runtime first.

## 7. The first successful agent run

With Ollama running using those environment variables, I returned to the project:

~~~bash
cd ~/Desktop/Coding/Projects/hf-agents
source .venv/bin/activate
python agent.py
~~~

This time the full run completed. The log showed two agent steps. First, the agent generated Python code:

~~~python
result = 15 * 24
result
~~~

The execution output was 360. Then the agent called final_answer(360) and returned the final result.

![Successful smolagents run: generated code executes and the agent returns 360](./images/12.png)

The answer itself was just a multiplication, but getting there meant each layer was finally connected: Ollama was serving Qwen locally, LiteLLM could call the API, and CodeAgent could generate and execute code.

One thing I noticed in the log was how long the run took on my CPU-only machine: the first step took about 59 seconds, followed by a second step of about 5.5 seconds. This isn't a performance benchmark, but it's a useful baseline for my current hardware and setup. The log also showed thousands of input tokens for a very small task, so I have room to learn how agent prompts and token usage affect local inference time.

## What I took away from this

The biggest lesson wasn't the multiplication. It was that a local agent has several moving parts, and the errors can happen at different layers:

1. **Ollama installation and service** — the command-line client needs a working local server.
2. **Model availability** — Qwen has to be downloaded before it can run.
3. **Inference runtime** — the llama-server executable and CPU backend libraries have to be discoverable.
4. **Python environment** — the project needs smolagents and the LiteLLM integration installed.
5. **Agent execution** — the model generates code, the agent executes it, and the result is returned.

The connection-refused error was a server-availability problem. The missing llama-server message was a binary-path problem. The later no backends are loaded message was a runtime-library discovery problem. Treating them as one generic Python error would've sent me in the wrong direction.

For this first task, Qwen generated the proposed Python operation, the agent's execution environment calculated the result, and the agent returned 360. That distinction matters: a CodeAgent isn't just printing the model's chat answer; it can use generated code as part of the task.

This is my starting point for the Hugging Face Agents course. Next, I want to move beyond arithmetic and see how agents use tools to do useful work.

---

**Working environment:** Ubuntu · Python .venv · smolagents[litellm] · LiteLLM · Ollama · Qwen2.5:1.5b

**Project directory:** ~/Desktop/Coding/Projects/hf-agents
