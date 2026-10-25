---
title: Running My First Local AI Agent — Hugging Face smolagents with Ollama and Qwen2.5
slug: local-huggingface-agent-ollama-qwen
date: 2026-10-25
excerpt: Setting up the Hugging Face Agents course environment on Ubuntu, running Qwen2.5:1.5b locally with Ollama, and connecting it to smolagents through LiteLLM for my first working agent.
tags: [Hugging Face, Agents, smolagents, Ollama, Qwen, LLM, Python, Linux, Local AI]
category: Learning Log
cover: ./images/cover.png
---

# Running My First Local AI Agent — Hugging Face smolagents with Ollama and Qwen2.5

I wanted to follow the Hugging Face Agents course while keeping the model running locally on my own machine. The goal was simple: install Ollama, download a small Qwen model, connect it to `smolagents`, and run my first agent without relying on a hosted model API.

This post records the working setup on Ubuntu, from the local model to the Python agent. I'm focusing on the setup and the final result rather than documenting every troubleshooting detour.

## The setup

My project lives at:

```text
~/Desktop/Coding/Projects/hf-agents
```

The main pieces are:

- **Ollama** to run the language model locally and expose its API.
- **Qwen2.5:1.5b** as the local model.
- **Python virtual environment** to keep project dependencies isolated.
- **smolagents** for the agent framework.
- **LiteLLM** to connect the agent framework to Ollama's chat API.

The machine is CPU-only, so I chose the small 1.5B Qwen model to get started.

## 1. Install and start Ollama

I started with Ollama's Linux installation, initially trying the Snap package before switching to the standard Linux installation route. I also had to work around a download issue during setup, so I kept checking which binary was installed and whether the local service was responding.

![Initial Ollama Snap installation attempt](./images/1.png)

![Removing the Snap package and retrying the Ollama installation](./images/3.png)

![Retrying the Ollama installation using HTTP/1.1](./images/4.png)

Once the installation was in place, I checked that Ollama's local API was reachable. Its default address is `http://127.0.0.1:11434`. The API can be checked with:

```bash
curl http://127.0.0.1:11434/api/version
curl http://127.0.0.1:11434/api/tags
```

The version endpoint reports the installed Ollama version, while the tags endpoint lists models already available locally.

![Checking the local Ollama API and installed version](./images/2.png)

I ultimately got the Ollama server running locally and kept its server process open while using the model from another terminal.

![Ollama server running locally](./images/5.png)

## 2. Download Qwen2.5:1.5b

With Ollama running, I downloaded the model:

```bash
/usr/local/bin/ollama pull qwen2.5:1.5b
```

Ollama downloaded the model weights to its local model store. The model can then be run directly from the terminal, without involving the Python agent yet.

![Downloading Qwen2.5 1.5B with Ollama](./images/6.png)

I tested the model interactively before connecting it to anything else. This was a useful checkpoint: it confirmed that the model was available and responding locally.

```bash
/usr/local/bin/ollama run qwen2.5:1.5b
```

![Testing Qwen2.5 directly in the terminal](./images/8.png)

## 3. Create the Python environment

Next, I created a dedicated virtual environment in the course project directory and installed the required packages:

```bash
cd ~/Desktop/Coding/Projects/hf-agents
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install "smolagents[litellm]"
```

Using a virtual environment keeps the course dependencies separate from the rest of the system. The `smolagents[litellm]` extra installs the LiteLLM integration used by this example.

![Creating and activating the Python virtual environment and installing dependencies](./images/7.png)

## 4. Connect smolagents to the local model

I created `agent.py` with the following code:

```python
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
```

A few details matter here:

- `ollama_chat/qwen2.5:1.5b` tells LiteLLM to use the Ollama chat integration with the model I downloaded.
- `api_base` points to Ollama's local API, not a hosted service.
- `num_ctx=4096` sets the requested context size for this model connection.
- `CodeAgent` is the agent type used in the Hugging Face example. It can generate Python code and execute it as part of solving a task.

![Writing agent.py with LiteLLMModel and CodeAgent](./images/9.png)

## 5. Run the first agent

I left the Ollama server running, activated the virtual environment, and executed the script:

```bash
cd ~/Desktop/Coding/Projects/hf-agents
source .venv/bin/activate
python agent.py
```

The agent completed the task in two steps. First, it generated and executed Python code:

```python
result = 15 * 24
result
```

The execution output was `360`. The agent then returned that value as its final answer.

![Successful first smolagents run returning 360](./images/12.png)

The result was simple, but it verified the entire path end to end: a local model served by Ollama, a LiteLLM connection, and a `smolagents` CodeAgent that generated and executed code.

## What I learned

The key lesson was that a local agent is more than just a model answering a prompt. The pieces have separate jobs:

1. **Ollama** serves the model locally.
2. **Qwen2.5:1.5b** generates the model's responses.
3. **LiteLLM** provides the model interface used by `smolagents`.
4. **CodeAgent** decides what code to generate, executes it, and returns the result.

For this multiplication task, Qwen proposed the Python operation, the agent's execution environment calculated the result, and the agent returned `360`.

This is now my baseline for following the Hugging Face Agents course with a local model. From here, I can move on to more interesting tasks and learn how agents use tools, rather than only asking a model questions in a terminal.

---

**Working environment:** Ubuntu · Python virtual environment · `smolagents` · LiteLLM · Ollama · Qwen2.5:1.5b
