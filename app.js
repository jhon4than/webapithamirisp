const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const schedule = require("node-schedule");
const moment = require("moment-timezone");

const GROUP_ID = "120363177352256950@g.us";
const SIGNAL_IMAGE_PATH = "./sinal.jpg"; // Caminho para a imagem do sinal
const SIGNAL_JUNTO_IMAGE_PATH = "./juntosinal.jpg"; // Caminho para a imagem do sinal
const SIGNAL_DUAS_IMAGE_PATH = "./aleatorio.jpg";

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on("ready", () => {
    console.log("Bot Online!");
    scheduleSignals(); // Agendar os sinais regulares para serem enviados
    scheduleRandomMessages(GROUP_ID, SIGNAL_DUAS_IMAGE_PATH); // Agendar os sinais aleatórios para serem enviados
});

function scheduleSignals() {
    console.log(
        "Agendando sinais para horários específicos com minutos definidos."
    );

    // Horários em que os sinais serão enviados, no horário de Brasília
    const signalTimes = [
        { hour: 7, minute: 2 },
        { hour: 10, minute: 2 },
        { hour: 13, minute: 4 },
        { hour: 16, minute: 5 },
        { hour: 19, minute: 3 },
    ];

    signalTimes.forEach((time) => {
        // Converte o horário de Brasília para o fuso horário local do servidor
        const timeInLocal = moment
            .tz({ hour: time.hour, minute: time.minute }, "America/Sao_Paulo")
            .local();

        // Verifica se o horário é antes das 23 horas
        if (timeInLocal.hour() < 23) {
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
        }
    });

    // Agendar a mensagem de finalização para as 23 horas de Brasília
    const endOfDayInLocal = moment
        .tz({ hour: 23, minute: 0 }, "America/Sao_Paulo")
        .local();

    schedule.scheduleJob(
        {
            hour: endOfDayInLocal.get("hour"),
            minute: endOfDayInLocal.get("minute"),
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
    client
        .getChatById(chatId)
        .then((chat) => {
            const mentions = chat.participants
                .filter((participant) => !participant.isMe) // Filtrar o próprio bot
                .map((participant) => participant.id._serialized); // Mapear para uma lista de IDs serializados

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

            const signalImageJunto = MessageMedia.fromFilePath(
                SIGNAL_JUNTO_IMAGE_PATH
            );

            // Enviar a mensagem com as menções
            client
                .sendMessage(chatId, signalImageJunto, {
                    caption: message,
                    mentions: mentions,
                })
                .then(() => {
                    console.log(
                        "Mensagem de minutos pagantes enviada com menções."
                    );
                })
                .catch((err) =>
                    console.error(
                        "Erro ao enviar mensagem de minutos pagantes:",
                        err
                    )
                );
        })
        .catch((err) =>
            console.error("Erro ao obter chat para minutos pagantes:", err)
        );
}

function generateRandomTimes() {
    let times = [];
    const currentTime = moment().tz("America/Sao_Paulo");
    const endTime = currentTime.clone().add(3, 'hours'); // Definir o horário final como 3 horas a partir de agora

    while (currentTime.isBefore(endTime)) {
        let timeString = currentTime.format('HH:mm'); // Formatar o horário atual
        times.push(`✅ ${timeString} 🕛`);
        currentTime.add(getRandomInt(7, 9), 'minutes'); // Adicionar um intervalo aleatório de 7 a 9 minutos
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
function scheduleRandomMessages(chatId, imagePath) {
    const randomTimes = generateTwoRandomTimes();

    // Ordena os horários para garantir que o primeiro sempre venha antes do segundo
    randomTimes.sort((a, b) =>
        a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute
    );

    randomTimes.forEach((time, index) => {
        // Converte os horários para milissegundos
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

        // Agenda o envio da mensagem
        setTimeout(() => {
            sendRandomSignal(chatId, imagePath);
        }, delay);

        // Se for o primeiro horário, agende também o segundo horário com um atraso adicional
        if (index === 0) {
            const additionalDelay = 1000 * 60 * 60; // 1 hora em milissegundos, por exemplo
            setTimeout(() => {
                sendRandomSignal(chatId, imagePath);
            }, delay + additionalDelay);
        }
    });
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
    const randomTimes = [];
    for (let i = 0; i < 2; i++) {
        const randomHour = getRandomInt(15, 23); // Horas entre 8 e 20
        const randomMinute = getRandomInt(0, 59); // Minutos entre 0 e 59
        randomTimes.push({ hour: randomHour, minute: randomMinute });
    }
    return randomTimes;
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
