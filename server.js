import { createServer } from "node:http"
import { readFile } from "fs/promises"

const PORT = 8213

let conversation = []
let server = createServer(async (req, res) => {
    /** Serve the HTML file */
    if (req.method === "GET" && req.url === "/") {
        res.statusCode = 200
        res.setHeader("Content-Type", "text/html")
        let buffer = await readFile("index.html")
        res.end(buffer)
        return
    }

    /** Reset the conversation */
    if (req.method === "POST" && req.url === "/reset") {
        conversation = []
        res.writeHead(302, { Location: "/" })
        res.end()
        return
    }

    /** Accept message from user */
    if (req.method === "POST" && req.url === "/conversation") {
        let body = ""

        // Collect data chunks
        req.on("data", (chunk) => {
            body += chunk.toString()
        })

        req.on("end", () => {
            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            let message = JSON.parse(body).message
            conversation.push({ role: "user", content: message })
            res.end()
        })
        return
    }

    /**
     * Get a response from the LLM
     */
    if (req.method === "GET" && req.url === "/conversation") {
        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")
        res.flushHeaders()

        let response = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            body: JSON.stringify({
                model: "llama3.2",
                messages: conversation,
            }),
            headers: { "Content-Type": "application/json" },
        })

        let decoder = new TextDecoder()
        let content = "" // Buffer to hold incoming JSON objects

        // Process the stream chunk by chunk using for await
        for await (let chunk of response.body) {
            let decodedChunk = decoder.decode(chunk, { stream: true })
            let parsed = JSON.parse(decodedChunk)
            if (parsed.done) {
                break
            }

            // Send an SSE message to the client for each chunk
            let obj = { message: content, complete: false }
            res.write(`data: ${JSON.stringify(obj)}\n\n`)
            content += parsed.message.content
        }

        // store the message in the conversation
        conversation.push({ role: "assistant", content })

        // Send final SSE message indicating completion
        let obj = { message: content, complete: true }
        res.write(`data: ${JSON.stringify(obj)}\n\n`)
        res.end()
        return
    }

    /** Fallback */
    res.statusCode = 404
    res.setHeader("Content-Type", "text/html")
    res.end("<h1>not found</h1>")
})

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`)
})
