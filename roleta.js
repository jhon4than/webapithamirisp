const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const fs = require("fs");
const schedule = require("node-schedule");

class RouletteBot {
    constructor(api_url) {
        this.client = new Client({
            authStrategy: new LocalAuth(),
        });
        this.client.on("qr", (qr) => {
            qrcode.generate(qr, { small: true });
        });
        this.chatId = "120363214348020444@g.us"; // Substitua pelo ID do chat do WhatsApp
        this.api_url = api_url;
        this.sinal = false;
        this.indicacao1 = 0;
        this.indicacao2 = 0;
        this.entrada = 0;
        this.todas_entradas = [];
        this.operacoes = [];
        this.quantidade_greens = 0;
        this.quantidade_reds = 0;
        this.horarios_envio = ["09:00", "12:00", "23:51"];
        this.contagem_sinais_enviados = 0;
        this.martingale_steps = 2;
        this.check_dados = [];
        this.ultimo_horario_envio = null;
        this.report_file = "daily_report.json";
        this.loadReport();

        this.client.initialize();
    }

    horarioAjustado() {
        const now = new Date();
        return `${now.getDate().toString().padStart(2, "0")}-${(
            now.getMonth() + 1
        )
            .toString()
            .padStart(2, "0")}-${now.getFullYear()} ${now
            .getHours()
            .toString()
            .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    }

    loadReport() {
        try {
            if (fs.existsSync(this.report_file)) {
                const fileContent = fs.readFileSync(this.report_file, "utf8");
                const data = JSON.parse(fileContent || "{}");
                this.operacoes = data.operacoes || [];
                this.quantidade_greens = data.quantidade_greens || 0;
                this.quantidade_reds = data.quantidade_reds || 0;
                console.log("Relatório carregado com sucesso.");
            } else {
                this.operacoes = [];
                this.quantidade_greens = 0;
                this.quantidade_reds = 0;
                console.log(
                    "Arquivo de relatório não encontrado. Iniciando com dados vazios."
                );
            }
        } catch (error) {
            console.error("Erro ao carregar o relatório:", error.message);
            this.operacoes = [];
            this.quantidade_greens = 0;
            this.quantidade_reds = 0;
        }
    }

    saveReport() {
        const data = {
            operacoes: this.operacoes,
            quantidade_greens: this.quantidade_greens,
            quantidade_reds: this.quantidade_reds,
        };
        try {
            fs.writeFileSync(this.report_file, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error("Erro ao salvar o relatório:", error.message);
        }
    }

    clearReportFile() {
        try {
            fs.writeFileSync(this.report_file, JSON.stringify({}));
        } catch (error) {
            console.error("Erro em limpar relatório:", error.message);
        }
    }

    async obterResultado(retries = 5, backoffFactor = 1.0) {
        const headers = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            cookie: "vid=1add2388-481c-49f1-b8ab-2bed487ed73c",
        };
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await axios.get(this.api_url, { headers });
                const data = response.data;
                if (data.gameTables) {
                    for (let x of data.gameTables) {
                        if (x.gameTableId === "103910" && x.lastNumbers) {
                            return x.lastNumbers;
                        }
                    }
                }
                return [];
            } catch (error) {
                console.error(
                    `Erro de rede (${error}), tentativa ${
                        attempt + 1
                    } de ${retries}.`
                );
                await sleep(attempt * backoffFactor * 1000);
            }
        }
        return [];
    }

    caracteristicas(data) {
        if (!data) {
            return [];
        }

        return data.map((numero) => {
            let coluna;
            if (numero === 0) coluna = 0;
            else if (numero <= 12) coluna = 1;
            else if (numero <= 24) coluna = 2;
            else if (numero <= 36) coluna = 3;
            else coluna = 4;

            return { numero, coluna };
        });
    }
    verificarAlerta(data) {
        const horarioAtual = this.horarioAjustado();
        const caracteristicas = this.caracteristicas(data);
        const numeros = caracteristicas.map((item) => item.numero);
        const colunas = caracteristicas.map((item) => item.coluna);
        console.log("Verificando alerta com os dados recebidos...");
        if (numeros.length > 0) {
            const ultimoNumero = numeros[0];

            if (this.sinal) {
                this.correcao(
                    numeros,
                    colunas,
                    this.indicacao1,
                    this.indicacao2
                );
            } else {
                if (colunas.slice(0, 2).every((col) => col === 3)) {
                    this.sinal = true;
                    this.indicacao1 = 1;
                    this.indicacao2 = 2;
                    this.enviarSinal(
                        this.indicacao1,
                        this.indicacao2,
                        ultimoNumero,
                        horarioAtual
                    );
                } else if (colunas.slice(0, 2).every((col) => col === 2)) {
                    this.sinal = true;
                    this.indicacao1 = 1;
                    this.indicacao2 = 3;
                    this.enviarSinal(
                        this.indicacao1,
                        this.indicacao2,
                        ultimoNumero,
                        horarioAtual
                    );
                } else if (colunas.slice(0, 2).every((col) => col === 1)) {
                    this.sinal = true;
                    this.indicacao1 = 2;
                    this.indicacao2 = 3;
                    this.enviarSinal(
                        this.indicacao1,
                        this.indicacao2,
                        ultimoNumero,
                        horarioAtual
                    );
                }
            }
        }
    }

    correcao(numeros, colunas, indicacao1, indicacao2) {
        console.log("Realizando correção...");
        if ([indicacao1, indicacao2, 0].includes(colunas[0])) {
            this.todas_entradas.push(numeros[0]);
            this.green();
            this.reset();
        } else {
            this.martingale();
        }
    }

    async enviarSinal(indicacao1, indicacao2, ultimoNumero, horario) {
        console.log(
            `Preparando para enviar sinal: Colunas ${indicacao1} e ${indicacao2}`
        );
        const texto =
            `🎯 Entrada Confirmada 🎯\n\n` +
            `🖥️ Roleta: ROLETA BRAZILEIRA 🇧🇷\n` +
            `🔥 Entrar: ${indicacao1}º e ${indicacao2}º COLUNA\n` +
            `🛟 Até duas proteções - Cobrir o zero!\n\n` +
            `🧨 Último número: ${ultimoNumero}\n` +
            `<a href="https://www.segurobet.com/slots/320/26560?accounts=*&register=*&btag=1504084_l254743&AFFAGG=&mode=fun&provider=all">💸 Clique aqui para abrir a corretora</a>`;
        console.log(
            `Enviando sinal para as colunas ${indicacao1} e ${indicacao2}, último número: ${ultimoNumero}. Horário: ${horario}`
        );

        try {
            await this.client.sendMessage(this.chatId, texto);
            this.contagemSinaisEnviados += 1;
            console.log("Sinal enviado com sucesso.");
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
        }
    }

    async enviarMensagemEspecifica() {
        const mensagemIniciando = "⏳ 5 minutos para iniciar os sinais!";
        try {
            await this.client.sendMessage(this.chatId, mensagemIniciando);
            console.log(
                "Esperando tempo de 5 minutos para começar enviar sinais!"
            );
            // await new Promise((resolve) => setTimeout(resolve, 360000)); // Espera 5 minutos (360 segundos)
            await new Promise((resolve) => setTimeout(resolve, 360)); // Espera 5 minutos (360 segundos)

            const textoMensagem =
                "🚨 ATENÇÃO - Iniciando os sinais!\n" +
                '<a href="https://www.segurobet.com/slots/320/26560?accounts=*&register=*&btag=1504084_l254743&AFFAGG=&mode=fun&provider=all">💸 Clique aqui para se cadastrar e lucrar</a>';
            await this.client.sendMessage(this.chatId, textoMensagem);
            console.log("Iniciando...");
        } catch (error) {
            console.error("Erro ao enviar mensagem específica:", error);
        }
    }

    async martingale() {
        this.entrada += 1;
        console.log(`Executando martingale, passo ${this.entrada}`);
        if (this.entrada <= this.martingale_steps) {
            const texto = `⌛️ Vamos iniciar o ${this.entrada}° Gale`;
            try {
                await this.client.sendMessage(this.chatId, texto);
                // No WhatsApp, não é possível apagar a mensagem do bot enviada para outro usuário
                await new Promise((resolve) => setTimeout(resolve, 15000)); // Espera 15 segundos
            } catch (error) {
                console.error("Erro ao enviar mensagem de martingale:", error);
            }
        } else {
            this.red();
            this.reset();
        }
    }

    async green() {
        const horario = this.horarioAjustado();
        this.operacoes.push({ horario, resultado: "GREEN" });
        this.quantidade_greens += 1;
        const texto = `✅ GREEN! ${this.todas_entradas}`;
        console.log("Registrando GREEN...");
        try {
            await this.client.sendMessage(this.chatId, texto);
            console.log(
                `Entrada GREEN no horário ${horario}. Total de GREENs: ${this.quantidade_greens}`
            );
        } catch (error) {
            console.error("Erro ao enviar mensagem GREEN:", error);
        }
    }

    async red() {
        const horario = this.horarioAjustado();
        this.operacoes.push({ horario, resultado: "RED" });
        this.quantidade_reds += 1;
        console.log("Registrando RED...");
        const texto = `❌ Loss...`;
        try {
            await this.client.sendMessage(this.chatId, texto);
            console.log(
                `Entrada RED no horário ${horario}. Total de REDs: ${this.quantidade_reds}`
            );
        } catch (error) {
            console.error("Erro ao enviar mensagem RED:", error);
        }
    }

    dataAtual() {
        const now = new Date();
        return `${now.getDate().toString().padStart(2, "0")}/${(
            now.getMonth() + 1
        )
            .toString()
            .padStart(2, "0")}/${now.getFullYear()}`;
    }

    async generateReport(finalReport = false) {
        const dataAtual = this.dataAtual();
        let textoRelatorio = `📊HISTÓRICO DAS ENTRADAS - ${dataAtual}\n\n`;
        console.log("Gerando relatório...");
        this.operacoes.forEach(({ horario, resultado }) => {
            const horarioFormatado = horario
                ? horario.split(" ")[1]
                : "Horário Desconhecido";
            textoRelatorio += `${horarioFormatado} - ${
                resultado === "GREEN" ? "GREEN ✅" : "RED ❌"
            }\n`;
        });

        textoRelatorio += `\n✅ GREEN ${this.quantidade_greens} x RED ❌ ${this.quantidade_reds}`;
        try {
            await this.client.sendMessage(this.chatId, textoRelatorio);
            console.log("Gerando relatório...");
            this.saveReport();
            console.log("Esperando próximo horário...");

            if (finalReport) {
                this.clearReportFile();
                console.log("Relatório final do dia gerado e salvo.");
            }
        } catch (error) {
            console.error("Erro ao enviar relatório:", error);
        }
    }

    reset() {
        this.entrada = 0;
        this.todas_entradas = [];
        this.sinal = false;
    }

    convertToMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    }

    shouldSendSignal(currentMinutes, targetMinutes) {
        return currentMinutes === targetMinutes;
    }
    async main() {
        const horariosEmMinutos = this.horarios_envio.map(
            this.convertToMinutes.bind(this)
        );
        let horariosEnviados = {};
        let mensagemEnviada = {};
        let ultimoHorarioEnvio = null;

        horariosEmMinutos.forEach((horario) => {
            horariosEnviados[horario] = false;
            mensagemEnviada[horario] = false;
        });

        console.log("Iniciando o loop principal do bot...");

        while (true) {
            const now = new Date();
            const minutosAtuais = now.getHours() * 60 + now.getMinutes();
            console.log(`Hora atual em minutos: ${minutosAtuais}`);

            for (const horario of horariosEmMinutos) {
                console.log(`Verificando horário de envio: ${horario}`);

                if (minutosAtuais === horario && !mensagemEnviada[horario]) {
                    console.log(
                        `Enviando mensagem específica para horário ${horario}`
                    );
                    await this.enviarMensagemEspecifica();
                    mensagemEnviada[horario] = true;
                }

                if (minutosAtuais === horario && !horariosEnviados[horario]) {
                    console.log(`Obtendo resultado para horário ${horario}`);
                    const data = await this.obterResultado();
                    console.log("Recebendo dados da API...");

                    if (data !== this.check_dados) {
                        console.log(
                            "Dados recebidos são diferentes dos anteriores. Verificando alerta..."
                        );
                        this.verificarAlerta(data);
                        this.check_dados = data;
                    }

                    if (this.contagemSinaisEnviados >= 5) {
                        console.log(
                            "Contagem de sinais enviados alcançou o limite. Gerando relatório..."
                        );
                        if (!this.sinal) {
                            await this.generateReport();
                            this.contagemSinaisEnviados = 0;
                            horariosEnviados[horario] = true;
                        }
                    }
                }
            }

            if (
                minutosAtuais > Math.max(...horariosEmMinutos) &&
                (ultimoHorarioEnvio === null ||
                    ultimoHorarioEnvio !== now.toDateString())
            ) {
                console.log(
                    "Verificando a necessidade de gerar relatório final do dia..."
                );
                if (!this.sinal) {
                    ultimoHorarioEnvio = now.toDateString();
                    console.log(
                        `Relatório final do dia gerado. Data: ${ultimoHorarioEnvio}`
                    );
                }
            }

            if (minutosAtuais === 0) {
                console.log(
                    "Resetando horários e mensagens enviadas para o próximo dia..."
                );
                this.horarios_envio.forEach((horario) => {
                    horariosEnviados[horario] = false;
                    mensagemEnviada[horario] = false;
                });
            }

            console.log("Esperando 5 segundos antes da próxima verificação...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}

// Inicialização e loop principal do bot
const api_url = "https://casino.betfair.com/api/tables-details";
const bot = new RouletteBot(api_url);
console.log("Iniciando bot...");
bot.main();
