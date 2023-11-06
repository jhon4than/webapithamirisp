const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");
const moment = require("moment-timezone");

const GROUP_ID = "120363177352256950@g.us";
const SIGNAL_IMAGE_PATH = "./sinal.jpg"; // Caminho para a imagem do sinal

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on("ready", () => {
    console.log("Bot Online!");
    scheduleSignals(); // Agendar os sinais para serem enviados
});

// Verifica a data e hora atuais
function checkCurrentTime() {
    const now = new Date(); // Cria um novo objeto Date, que possui a data e hora atuais
    const currentTime = now.toISOString(); // Converte para uma string no formato ISO para fácil leitura
    console.log(`A data e hora atuais são: ${currentTime}`);
}

function scheduleSignals() {
    console.log(
        "Agendando sinais para horários específicos com minutos definidos."
    );

    // Define os horários exatos em que os sinais serão enviados no horário de Brasília
    const signalTimes = [
        { hour: 6, minute: 2 },
        { hour: 9, minute: 2 },
        { hour: 12, minute: 4 },
        { hour: 15, minute: 5 },
        { hour: 18, minute: 7 },
        { hour: 21, minute: 2 },
        // ... Adicione mais horários conforme necessário
    ];

    signalTimes.forEach((time) => {
        // Subtrai 3 da hora para ajustar ao horário da máquina, se necessário
        let adjustedHour = time.hour - 3;
        console.log(adjustedHour);
        // Chame a função para verificar a data e hora
        checkCurrentTime();
        console.log(signalTimes);
        // Se a hora ajustada for negativa, ajusta para o dia anterior
        if (adjustedHour < 0) {
            adjustedHour += 24;
        }

        schedule.scheduleJob(
            {
                hour: adjustedHour,
                minute: time.minute,
            },
            function () {
                console.log(
                    `Enviando sinal para ${time.hour}:${time.minute} BRT.`
                );
                sendSignal(GROUP_ID);
            }
        );
    });

    // Agendar a mensagem de finalização para as 23 horas de Brasília
    let adjustedEndHour = 23 - 3; // Ajustar para o horário da máquina
    if (adjustedEndHour < 0) {
        adjustedEndHour += 24;
    }

    schedule.scheduleJob(
        {
            hour: adjustedEndHour,
            minute: 0,
        },
        function () {
            console.log("Enviando mensagem de finalização do dia.");
            sendEndOfDayMessage(GROUP_ID);
        }
    );
}

function sendSignal(chatId) {
    setTimeout(() => {
        const signalImage = MessageMedia.fromFilePath(SIGNAL_IMAGE_PATH);
        const preSignalMessage =
            "👑 ATENÇÃO... IDENTIFICANDO PADRÕES🔎❗\n📊 ANALISANDO ALGORITMO...\n🎰 CADASTRE-SE AQUI:https://appinteligente.com/cadastro-pixhoje";
        console.log("Enviando mensagem de pré-sinal.");
        client
            .sendMessage(chatId, signalImage, { caption: preSignalMessage })
            .then(() => {
                console.log(
                    "Mensagem de pré-sinal enviada. Preparando para enviar a imagem do sinal."
                );
                setTimeout(() => {
                    sendMinutePayingMessage(chatId);
                }, 60000); // Enviar mensagem após 10 segundos da imagem do sinal
            });
    }, 1000); // Aguarda um segundo após a mensagem de pré-sinal para enviar a imagem
}

function sendMinutePayingMessage(chatId) {
    const randomTimes = generateRandomTimes();

    const message = `🚨 *ATENÇÃO NOS MINUTOS PAGANTES!!!!!*🚨
    
HORÁRIO DE BRASÍLIA
✅ SINAL VALIDO SOMENTE DENTRO DO MINUTO ✅
➖➖➖➖➖➖➖➖➖➖➖➖
➡ SE CADASTRE PARA JOGAR
🚨DEPOSITE QUALQUER VALOR PARA CONSEGUIR FAZER DE 400 A 500 POR DIA
▶Quanto maior o valor de depósito + você consegue lucrar

       👇 PLATAFORMA QUE MAIS PAGA 👇
➡ https://appinteligente.com/cadastro-pixhoje

🎰 SLOTS: Tigre, Touro, Rato e Coelho.

📣‼Casa de aposta PIXHOJE.NET ✅ ‼📣
${randomTimes}

🐌 4x Normal 
⚡ 7x Turbo 

Sinais enviados AO VIVO pelos meus analistas de jogos de slots. 📊💲⚠🤑

➖➖➖➖➖➖➖➖➖➖➖
🔔 FAZ O CADASTRO DENTRO DA CASA DE APOSTA 👇🏻

➡ https://appinteligente.com/cadastro-pixhoje`;

    console.log("Enviando mensagem de minutos pagantes.");
    client.sendMessage(chatId, message);
}

function generateRandomTimes() {
    let times = [];
    const currentTime = moment().tz("America/Sao_Paulo");
    let baseMinute = currentTime.minute() + 20; // Começa 20 minutos após a hora atual
    let baseTime = currentTime.hour() * 60 + baseMinute; // Convertendo para minutos

    const endTime = 23 * 60; // 23 horas convertidas em minutos

    // Verifica se já passou das 23 horas. Se sim, não gera novos tempos.
    if (baseTime >= endTime) {
        return times;
    }

    // Calcular quantos sinais são necessários para cobrir até as 23 horas
    while (baseTime < endTime) {
        if (baseTime >= 60 * 24) {
            baseTime -= 60 * 24; // Se passar de meia-noite, ajusta para continuar a contagem
        }
        let timeString = formatTime(baseTime);
        times.push(`✅ ${timeString} 🕛`);
        baseTime += getRandomInt(5, 7); // Adiciona um intervalo aleatório entre 5 e 7 minutos

        // Verifica se a próxima baseTime ultrapassará 23 horas e para se necessário
        if (baseTime >= endTime) {
            break;
        }
    }

    return times.join("\n");
}

function getRandomInt(min, max) {
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
    const endOfDayMessage = `✅🔥 FINALIZAMOS MAIS UM TURNO 100% POSITIVOOOOOOO

    💰COMO PEGAR NOSSOS SINAIS E FAZER DE R$ 100 A R$ 500 POR DIA💰
    
    PASSO 1: SE CADASTRE NA CASA DE APOSTAS:
    
    ➡ https://pixhoje.net
    
    PASSO 2: DEPOSITE A PARTIR DE R$ 25,00
    
    PASSO 3: PEGUE OS SINAIS NO MINUTO EXATO!!
    
    BANCAS QUE MAIS ESTÃO LUCRANDO:
    🥇R$100,00
    🥈R$50,00
    
    ✅ MANDA SEU FEEDBACK COM O SEU RESULTADO!!!! No insta https://www.instagram.com/_thamiresmoura/`;

    client.sendMessage(chatId, endOfDayMessage);
}

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

// client.on('ready', () => {
//     console.log('Client is ready!');
//     client.getChats().then(chats => {
//         const groups = chats.filter(chat => chat.isGroup);
//         groups.forEach(group => {
//             console.log(`Group Name: ${group.name}, Group ID: ${group.id._serialized}`);
//         });
//     });
// });
