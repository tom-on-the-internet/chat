# 텀 Chat

A simple demo of Server-sent events (SSE) using an LLM.

Video here: <https://youtu.be/eWPBKaCDZyY>

## Run it

```sh
# Start the container containing the LLM
docker run --rm -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Pull the LLM (Big, 2GB)
docker exec -it ollama ollama pull llama3.2

# Start the server
node server.js

# Visit the app at http://locahost:8213
```
