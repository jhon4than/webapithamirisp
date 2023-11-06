const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

let perguntasERespostas = [];

function atualizarPerguntasERespostas() {
    const appJSContent = fs.readFileSync('app.js', 'utf8');
    perguntasERespostas = [];

    const regex = /if\(message.body === '([^']+)'\) {[\s\S]+?client.sendMessage\(message.from, '([^']+)'\);/g;
    let match;

    while ((match = regex.exec(appJSContent))) {
        perguntasERespostas.push({
            pergunta: match[1],
            resposta: match[2],
        });
    }
}

app.get('/', (req, res) => {
    atualizarPerguntasERespostas();
    res.sendFile(__dirname + '/form.html');
});

app.post('/adicionar', (req, res) => {
    const novaPergunta = req.body.pergunta;
    const novaResposta = req.body.resposta;

    perguntasERespostas.push({ pergunta: novaPergunta, resposta: novaResposta });
    atualizarAppJS();

    // Envia um alerta para o navegador do usuário
    res.send('<script>alert("Pergunta e resposta adicionadas com sucesso!"); window.location = "/";</script>');
});

function atualizarAppJS() {
    const appJSContent = fs.readFileSync('app.js', 'utf8');
    let novoConteúdo = appJSContent;

    // Encontra a posição em que você deseja adicionar os novos manipuladores de eventos
    const posicaoInserir = novoConteúdo.lastIndexOf('client.initialize();');

    // Constrói a seção dos novos manipuladores de eventos
    let novosHandlers = '';
    perguntasERespostas.forEach(item => {
        novosHandlers += `
        client.on('message', message => {
            if (message.body === '${item.pergunta}') {
                client.sendMessage(message.from, '${item.resposta}');
            }
        });
        `;
    });

    // Insere a seção dos novos manipuladores de eventos na posição apropriada
    novoConteúdo = novoConteúdo.slice(0, posicaoInserir) + novosHandlers + novoConteúdo.slice(posicaoInserir);

    fs.writeFileSync('app.js', novoConteúdo);
}


app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
