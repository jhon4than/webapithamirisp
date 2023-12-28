const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");
const moment = require("moment-timezone");
const fs = require('fs');
const path = require('path');

const botActive = { value: true };
let startDate = new Date(); // Data de início do bot

function checkIfShouldPause() {
    let currentDate = new Date();
    let timeDiff = currentDate - startDate;
    let daysPassed = timeDiff / (1000 * 60 * 60 * 24); // Convertendo de milissegundos para dias

    if (daysPassed >= 30) {
        console.log("30 dias passaram, bot está agora em pausa.");
        botActive.value = false;
        // Aqui você pode limpar todos os agendamentos ou intervalos que o bot esteja utilizando
    } else {
        // Reagendar a verificação para o próximo dia
        setTimeout(checkIfShouldPause, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
    }
}

// Inicia a primeira verificação
setTimeout(checkIfShouldPause, 24 * 60 * 60 * 1000);
const GROUP_ID = "120363207227880718@g.us";

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on("ready", () => {
    console.log("Client is ready!");
    getAllContactNumbers();
});

function getAllContactNumbers() {
    client.getChats().then(chats => {
        const individualChats = chats.filter(chat => !chat.isGroup);
        const contactNumbers = individualChats.map(chat => {
            // Extrai o número, adiciona o prefixo '+55' e remove caracteres não numéricos
            return chat.id.user.replace(/\D/g, '');
        });

        // Salvando os números em um arquivo CSV
        saveNumbersToCSV(contactNumbers);
    }).catch(err => {
        console.error("Erro ao recuperar chats:", err);
    });
}

function saveNumbersToCSV(numbers) {
    const csvContent = numbers.join('\n');
    const filePath = path.join(__dirname, 'contactNumbers.csv');
    fs.writeFile(filePath, csvContent, 'utf8', (err) => {
        if (err) {
            console.error('Ocorreu um erro ao salvar o arquivo CSV:', err);
        } else {
            console.log('Arquivo CSV salvo com sucesso:', filePath);
        }
    });
}


function scheduleSignals() {
    console.log(
        "Agendando sinais para horários específicos com minutos definidos."
    );

    const signalTimes = [
        { hour: 9, minute: 2 },
        { hour: 13, minute: 2 },
        { hour: 18, minute: 15 },
        { hour: 23, minute: 25 }, // Não precisa mais verificar se é antes das 23h
    ];

    signalTimes.forEach((time) => {
        const timeInLocal = moment
            .tz({ hour: time.hour, minute: time.minute }, "America/Sao_Paulo")
            .local();

        console.log(timeInLocal);
        schedule.scheduleJob(
            {
                hour: timeInLocal.get("hour"),
                minute: timeInLocal.get("minute"),
            },
            function () {
                console.log(
                    `Enviando sinal para ${time.hour}:${time.minute} BRT.`
                );
                sendSignal(GROUP_ID);
            }
        );
    });
}

// Agora, em suas funções que enviam mensagens, você deve verificar se o bot está ativo
function sendSignal(chatId) {
    if (botActive.value) {
        sendMinutePayingMessage(chatId);
    } else {
        console.log("Bot está pausado e não pode enviar sinais.");
    }
}

function sendMinutePayingMessage(chatId) {
    const randomTimes = generateRandomTimes();
    const message = `🚨 *ATENÇÃO NOS MINUTOS PAGANTES!*🚨
HORÁRIO DE BRASÍLIA
✅SINAL VALIDO SOMENTE DENTRO DO MINUTO✅
➖➖➖➖➖➖➖➖➖➖➖
Tigre,Touro,Rato,Coelho,Dragão 
➖➖➖➖➖➖➖➖➖➖➖
${randomTimes}

🐌 13x Normal 
⚡ 8  xTurbo

✅ CADASTRE-SE PARA JOGAR
➡ https://bit.ly/Cadastre-Se_Contavip`;

    // Enviar a mensagem de texto simples
    client
        .sendMessage(chatId, message)
        .then(() => {
            console.log("Mensagem de minutos pagantes enviada.");
        })
        .catch((err) => {
            console.error("Erro ao enviar mensagem de minutos pagantes:", err);
        });
}

function generateRandomTimes() {
    let times = [];
    const currentTime = moment().tz("America/Sao_Paulo");
    const endTime = currentTime.clone().add(3, "hours"); // Definir o horário final como 3 horas a partir de agora

    while (currentTime.isBefore(endTime)) {
        let timeString = currentTime.format("HH:mm"); // Formatar o horário atual
        times.push(`⏰💲 ${timeString}`);
        currentTime.add(getRandomInt(7, 9), "minutes"); // Adicionar um intervalo aleatório de 7 a 9 minutos
    }

    // Se a quantidade de horários for ímpar, remover o último horário
    if (times.length % 2 !== 0) {
        times.pop();
    }

    // Criar pares de horários e organizá-los em linhas
    let pairedTimes = [];
    for (let i = 0; i < times.length; i += 2) {
        pairedTimes.push(`${times[i]} | ${times[i + 1]}`);
    }

    // Juntar os pares de horários com uma quebra de linha entre eles
    return pairedTimes.join("\n");
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}`;
}

function sendEndOfDayMessage(chatId) {
    const endOfDayMessage = `✅🔥 FINALIZAMOS MAIS UM DIA POSITIVOOOOOOO!!!

    💰COMO PEGAR NOSSOS SINAIS E FAZER DE R$ 100 A R$ 500 POR DIA💰
    
    PASSO 1: SE CADASTRE NA CASA DE APOSTAS:
    
    ➡ https://bit.ly/Cadastre-Se_Contavip
    
    PASSO 2: DEPOSITE A PARTIR DE R$ 30,00
    
    PASSO 3: PEGUE OS SINAIS NO MINUTO EXATO!!
    
    BANCAS QUE MAIS ESTÃO LUCRANDO:
    🥇R$50,00
    🥈R$40,00
    🥉R$30,00

    NÃO SE ESQUEÇA, SE VOCÊ REALMENTE QUER LUCRAR  
    SEMPRE FAÇA GERENCIAMENTO DE BANCA!!

    ✅ QUEM AÍ LUCROU?? MANDA SEU FEEDBACK NO MEU PRIVADO!!!!
    
    😉 Ficou com dúvida? Me chame no Privado, nossa equipe irá te ajudar`;

    client.sendMessage(chatId, endOfDayMessage);
}
function scheduleRandomMessages(chatId, imagePath) {
    const [time] = generateTwoRandomTimes(); // Agora gera apenas um horário

    // Converte o horário para milissegundos
    const now = new Date();
    const targetTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        time.hour,
        time.minute
    );

    // Se o horário já passou, agende para o próximo dia
    if (targetTime.getTime() < now.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    // Calcula o atraso em milissegundos
    const delay = targetTime.getTime() - now.getTime();

    // Agenda o envio da mensagem uma vez
    setTimeout(() => {
        sendRandomSignal(chatId, imagePath);
    }, delay);
}

function sendRandomSignal(chatId, imagePath) {
    const signalImage = MessageMedia.fromFilePath(imagePath);
    const message = ""; // Sua mensagem aqui

    client
        .sendMessage(chatId, signalImage, { caption: message })
        .then(() => {
            console.log("Sinal aleatório enviado.");
        })
        .catch((err) => console.error("Erro ao enviar sinal aleatório:", err));
}

function generateTwoRandomTimes() {
    // Gera apenas um horário aleatório
    const randomHour = getRandomInt(0, 23); // Horas entre 0 e 23
    const randomMinute = getRandomInt(0, 59); // Minutos entre 0 e 59
    return [{ hour: randomHour, minute: randomMinute }];
}

// client.on("qr", (qr) => {
//     qrcode.generate(qr, { small: true });
// });

client.on("ready", () => {
    console.log("Client is ready!");
    client.getChats().then((chats) => {
        const groups = chats.filter((chat) => chat.isGroup);
        groups.forEach((group) => {
            console.log(
                `Group Name: ${group.name}, Group ID: ${group.id._serialized}`
            );
        });
    });
});
