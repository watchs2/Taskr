import {createTask,listAllTasks,taskScheduleToday , stopTask, startTask,showCurrentStatus,showTodayTotalTime,markTaskAsDone,markTaskAsTodo,editTask,showDayReport,showWeekReport,showMonthReport} from '../model/task'
import { getTodayDate, convertToISO } from '../utils/dateUtils';


export function parsingCommands(args: string[]) {
    if (args.length <= 0) {
        console.error("[ERRO] - É preciso adicionar mais argumentos usa taskr --help para ver todos os comandos");
        return;
    }
    const command = args[0];
    switch (command) {
        case 'add':
            parseAdd(args);
            break;
        case 'ls':
            parseLs(args);
            break;
        case 'del':
            parseDelete(args);
            break;
        case 'start':
            parseStart(args);
            break;
        case 'stop':
            parseStop(args);
            break;
        case '--help':
            parseHelp(args)
            break;
        case 'status':
            parseStatus(args);
            break;
        case 'done':
            parseDone(args);
            break;
        case 'edit':
            parseEdit(args);
            break;
        case 'report':
            parseReport(args);
            break;
        case 'todo':
            parseTodo(args);
            break;
        default:
            console.error("[ERRO] - Comando inválido consulta os comandos válidos em  taskr --help ");
    }

}

/*
taskr add <name> <flags> 
    flags:
    -t para schedule hoje
    -s para adicionar schedule

    sem flags simplesmente cria
*/
function parseAdd(args: string[]) {
    // args[0] é "add"
    // args[1] é o nome da tarefa
    
    if (args.length < 2) {
        console.error("[ERRO] - Uso: taskr add <nome> [flags]");
        return;
    }

    const name = args[1];
    let schedule: string | null = null;

    // Caso 1: Apenas o nome -> taskr add "nome"
    if (args.length === 2) {
        createTask(name, null);
        return;
    }

    // Caso 2: Tem flags
    const flag = args[2];

    if (flag === '-t') {
        // Flag -t (Today)
        schedule = getTodayDate(); // Retorna "2026-01-05"
        createTask(name, schedule);

    } else if (flag === '-s') {
        // Flag -s (Schedule) -> Requer mais um argumento com a data
        if (args.length < 4) {
            console.error("[ERRO] - A flag -s precisa de uma data. Ex: -s 05/01/2026");
            return;
        }

        const dateInput = args[3]; // A data "05/01/2026"
        const isoDate = convertToISO(dateInput);

        if (isoDate) {
            schedule = isoDate;
            createTask(name, schedule);
        } else {
            console.error(`[ERRO] - Data inválida: "${dateInput}". Usa o formato DD/MM/AAAA.`);
        }

    } else {
        console.error(`[ERRO] - Flag desconhecida: ${flag}`);
    }
}

/*
taskr ls [flags]
-> sem flags: mostra tarefas de hoje (sem done)
-> -a: mostra todas as tarefas (sem done)
-> -d, --done: inclui tarefas done
-> -a -d: mostra todas as tarefas incluindo done
*/

function parseLs(args: string[]) {
    let includeDone = false;
    let showAll = false;
    
    // Processa flags
    for (let i = 1; i < args.length; i++) {
        const flag = args[i];
        if (flag === '-a' || flag === '--all') {
            showAll = true;
        } else if (flag === '-d' || flag === '--done') {
            includeDone = true;
        } else {
            console.error(`[ERRO] Flag desconhecida: ${flag}.`);
            console.error(`       Flags disponíveis: -a (all), -d (done)`);
            return;
        }
    }
    
    if (showAll) {
        listAllTasks(includeDone);
    } else {
        taskScheduleToday(includeDone);
    }
}

/*
taskr delete <id>
*/

function parseDelete(args: string[]) {
    if (args.length < 1) {
        console.error("[ERRO] - Comando inválido usa exemplo: taskr delete <id>");
    }
   if (args.length == 2 && validToken(args[1])) { 
        if (!isFlag(args[1])) {
            console.log(`[INFO] não implementado delete id:${args[1]}`)
        } else {
            console.error("[ERRO] - flag passada é inválida neste comando");
        }

    }
}

/*
taskr start <descrição> - cria tarefa automaticamente se não existir e começa logo
*/
function parseStart(args: string[]){
    if (args.length < 2) {
        console.error("[ERRO] - Uso: taskr start <descrição>");
        console.error("  Exemplo: taskr start Desenvolver nova funcionalidade");
        return; 
    }
    
    // Junta todos os argumentos depois de "start" para formar a descrição
    const description = args.slice(1).join(' ');
    
    if (validToken(description)) {
        // Tenta encontrar por nome/ID primeiro, se não encontrar cria automaticamente
        startTask(description, true); 
    } else {
        console.error("[ERRO] - Descrição inválida");
    }
}

/* 
taskr stop
*/

function parseStop(args: string[]) {
    stopTask();
}


function parseHelp(args: string[]) {
    console.log(`\nUso: taskr <comando> [argumentos]\n`);
    
    console.log(`Comandos disponíveis:`);
    
    // Comando ADD
    console.log(`  add <nome> [flags]   Cria uma nova tarefa.`);
    console.log(`      -t               Agendar para hoje.`);
    console.log(`      -s               Adicionar agendamento específico.`);
    
    // Comando LS
    console.log(`  ls [flags]           Lista as tarefas (padrão: hoje, sem tarefas done).`);
    console.log(`      -a               Lista todas as tarefas existentes.`);
    console.log(`      -d, --done       Inclui tarefas marcadas como done.`);
    console.log(`      -a -d            Lista todas as tarefas incluindo done.`);
    
    // Comando DEL
    console.log(`  del <id>             Remove uma tarefa permanentemente pelo ID.`);
    
    // Comando START
    console.log(`  start <descrição>    Cria uma tarefa (se não existir) e inicia o temporizador.`);
    console.log(`                       Exemplo: taskr start Desenvolver nova funcionalidade`);
    
    // Comando STOP
    console.log(`  stop                 Para o temporizador da tarefa atual.`);
    
    // Comando STATUS
    console.log(`  status [-t]          Mostra a tarefa atual ou o tempo total de hoje.`);
    
    // Comando DONE
    console.log(`  done <id | nome>     Marca uma tarefa como concluída.`);
    
    // Comando TODO
    console.log(`  todo <id | nome>     Marca uma tarefa como todo (reabre tarefa concluída).`);
    
    // Comando EDIT
    console.log(`  edit <id | nome>     Edita uma tarefa.`);
    console.log(`      -n <nome>        Edita o nome da tarefa.`);
    console.log(`      -s <data>        Edita o schedule (formato: DD/MM/AAAA).`);
    console.log(`      -s ""            Remove o schedule.`);
    
    // Comando REPORT
    console.log(`  report [day|week|month]  Mostra relatório detalhado de atividades.`);
    console.log(`      day (padrão)     Mostra relatório do dia atual.`);
    console.log(`      week             Mostra relatório da semana atual.`);
    console.log(`      month            Mostra relatório do mês atual.`);
    
    // Comando HELP
    console.log(`  --help               Mostra esta lista de comandos.\n`);
}
/*
Utility functions
*/

function isFlag(token: string): boolean {
    if (!validToken(token)) return false;
    if (token.length <= 1) return false;

    if (token.substring(0, 1) !== '-') return false

    return true
}

function validToken(token: string): boolean {
    if (token === null) return false;
    if (token === undefined) return false;
    if (token.length === 0) return false;

    return true;
}

function parseStatus(args: string[]) {
    if (args.length === 1) {
        showCurrentStatus();
        return;
    }

    if (args[1] === '-t') {
        showTodayTotalTime();
    } else {
        console.error(`[ERRO] Flag desconhecida: ${args[1]}`);
    }
}

function parseDone(args: string[]) {
    if (args.length < 2) {
        console.error("[ERRO] Uso: taskr done <id | nome>");
        return;
    }
    markTaskAsDone(args[1]);
}

/*
taskr todo <id | nome> - marca tarefa como todo (reabre tarefa concluída)
*/
function parseTodo(args: string[]) {
    if (args.length < 2) {
        console.error("[ERRO] Uso: taskr todo <id | nome>");
        return;
    }
    markTaskAsTodo(args[1]);
}

/*
taskr edit <id | nome> [flags]
    -n <novo_nome> para editar o nome
    -s <data> para editar o schedule (ou -s "" para remover)
*/
function parseEdit(args: string[]) {
    if (args.length < 2) {
        console.error("[ERRO] Uso: taskr edit <id | nome> [flags]");
        console.error("  Flags:");
        console.error("    -n <nome>     Edita o nome da tarefa");
        console.error("    -s <data>     Edita o schedule (formato: DD/MM/AAAA)");
        console.error("    -s \"\"          Remove o schedule");
        return;
    }
    
    const idOrName = args[1];
    let newName: string | undefined = undefined;
    let newSchedule: string | null | undefined = undefined;
    
    // Processa flags
    for (let i = 2; i < args.length; i++) {
        const flag = args[i];
        
        if (flag === '-n') {
            if (i + 1 < args.length) {
                // Junta todos os argumentos seguintes para o nome
                const nameParts = [];
                i++;
                while (i < args.length && !isFlag(args[i])) {
                    nameParts.push(args[i]);
                    i++;
                }
                i--; // Volta um passo
                newName = nameParts.join(' ');
            } else {
                console.error("[ERRO] A flag -n precisa de um nome.");
                return;
            }
        } else if (flag === '-s') {
            if (i + 1 < args.length) {
                i++;
                const scheduleInput = args[i];
                if (scheduleInput === '""' || scheduleInput === "''" || scheduleInput === '') {
                    newSchedule = null; // Remove schedule
                } else {
                    const isoDate = convertToISO(scheduleInput);
                    if (isoDate) {
                        newSchedule = isoDate;
                    } else {
                        console.error(`[ERRO] Data inválida: "${scheduleInput}". Usa o formato DD/MM/AAAA.`);
                        return;
                    }
                }
            } else {
                console.error("[ERRO] A flag -s precisa de uma data.");
                return;
            }
        }
    }
    
    if (newName === undefined && newSchedule === undefined) {
        console.error("[ERRO] É preciso especificar pelo menos uma flag (-n ou -s).");
        return;
    }
    
    editTask(idOrName, newName, newSchedule);
}

/*
taskr report [day | week | month]
*/
function parseReport(args: string[]) {
    if (args.length === 1) {
        // Por padrão mostra o dia
        showDayReport();
        return;
    }
    
    const period = args[1].toLowerCase();
    
    switch (period) {
        case 'day':
        case 'd':
            if (args.length > 2) {
                // Permite especificar uma data específica
                showDayReport(args[2]);
            } else {
                showDayReport();
            }
            break;
        case 'week':
        case 'w':
            showWeekReport();
            break;
        case 'month':
        case 'm':
            showMonthReport();
            break;
        default:
            console.error("[ERRO] Período inválido. Use: day, week ou month");
    }
}
