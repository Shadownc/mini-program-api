const express = require('express')
const dotenv = require('dotenv').config()
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const port = process.env.PORT;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


async function chat(content, res) {
    try {
        const completion = await openai.createChatCompletion({
            model: process.env.OPENAI_MODEL,
            messages: [{ role: "user", content }],
            max_tokens: 1024,
            temperature: 0.7,
            stream: true,
        }, {
            responseType: 'stream', 
            //本地调用开启代理
            // proxy: {
            //     host: "127.0.0.1", port: 7890, protocol: "socks5"
            // }
        });
        completion.data.on('data', data => {
            const lines = data.toString().split('\n').filter(line => line.trim() !== '')
            for (const line of lines) {
                res.write(`${line}\n`)
                if (line == 'data: [DONE]') {
                    res.end();
                }
            }
            // const lines = data.toString().split('\n').filter(line => line.trim() !== '');
            // for (const line of lines) {
            //     const message = line.replace(/^data: /, '');
            //     if (message === '[DONE]') {
            //         return; // Stream finished
            //     }
            //     try {
            //         const parsed = JSON.parse(message);
            //         console.log(parsed.choices[0].text);
            //     } catch (error) {
            //         console.error('Could not JSON parse stream message', message, error);
            //     }
            // }
        });
    } catch (error) {
        if (error.response?.status) {
            console.error(error.response.status, error.message);
            error.response.data.on('data', data => {
                const message = data.toString();
                try {
                    const parsed = JSON.parse(message);
                    console.error('An error occurred during OpenAI request: ', parsed);
                } catch (error) {
                    console.error('An error occurred during OpenAI request: ', message);
                }
            });
        } else {
            console.error('An error occurred during OpenAI request', error);
        }
    }
    // const chatCompletion = await openai.createChatCompletion({
    //     model: "gpt-3.5-turbo",
    //     messages: [{ role: "user", content }],
    // }, {
    //     proxy: {
    //         host: "127.0.0.1", port: 7890, protocol: "socks5"
    //     }
    // });
    // console.log(chatCompletion.data.choices[0].message);
    // res.send(chatCompletion.data.choices[0].message)

}

app.get('/chat', (req, res) => {
    const { message } = req.query
    res.setHeader('Content-type', 'application/octet-stream');
    chat(message, res)
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});