/*
 add
 ls
 del
 start
 done
 stop
 --help
*/



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
    if (args.length <= 1) {
        console.error("[ERRO] - Comando inválido usa exemplo: taskr add <nome>");
    }
    if (args.length == 2 && !isFlag(args[1]) && validToken(args[1])) {
         console.log(`[INFO] não implementado: nome:${args[1]}`)
        //createTask(name)
    } else if (args.length == 3 && validToken(args[2])) { 
        if (isFlag(args[2])) {
            //TODO: fazer uma função para validar todas as flags de add
            const flag = args[2];
            if (flag === '-t') {
                //const shecudel = today
                //createTask(name,today)
                console.log(`[INFO] não implementado: nome:${args[1]} a flag:${args[2]}`)
            } else if (flag === '-s') {
                console.log(`[INFO] não implementado: nome:${args[1]} a flag:${args[2]}`)
            } else {
                console.error("[ERRO] - flag passada é inválida");
            }
        } else {
            console.error("[ERRO] - flag passada é inválida");
        }

    }
}

/*
taskr ls <flags>
-> -a (all)
*/

function parseLs(args: string[]) {
    if (args.length < 1) {
        console.error("[ERRO] - Comando inválido usa exemplo: taskr ls");
    }
    if (args.length == 2 && !isFlag(args[1]) && validToken(args[1])) {
         console.log(`[INFO] não implementado: nome:${args[1]}`)
        //createTask(name)
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
taskr start <id | nome> se for nome cria uma tarefa e começa o shechedule logo 
*/

function parseStart(args: string[]){
    if (args.length < 1) {
        console.error("[ERRO] - Comando inválido usa exemplo: taskr start <id | nome>");
    }
    if (args.length == 2 && validToken(args[1])) { 
        if (!isFlag(args[1])) {
            console.log(`[INFO] não implementado start id:${args[1]}`)
        } else {
            console.error("[ERRO] - flag passada é inválida neste comando");
        }

    }
}

/* 
taskr stop
*/

function parseStop(args: string[]){
    //for now it does not have any command
      console.log(`[INFO] não implementado stop  arg1:${args[0]} arg2:${args[1]}`)
}


function parseHelp(args: string[]) {
    console.log(`\nUso: taskr <comando> [argumentos]\n`);
    
    console.log(`Comandos disponíveis:`);
    
    // Comando ADD
    console.log(`  add <nome> [flags]   Cria uma nova tarefa.`);
    console.log(`      -t               Agendar para hoje.`);
    console.log(`      -s               Adicionar agendamento específico.`);
    
    // Comando LS
    console.log(`  ls [flags]           Lista as tarefas (padrão: hoje).`);
    console.log(`      -a               Lista todas as tarefas existentes (histórico).`);
    
    // Comando DEL
    console.log(`  del <id>             Remove uma tarefa permanentemente pelo ID.`);
    
    // Comando START
    console.log(`  start <id | nome>    Inicia o temporizador de uma tarefa.`);
    console.log(`                       (Se passar um nome, cria a tarefa e inicia logo).`);
    
    // Comando STOP
    console.log(`  stop                 Para o temporizador da tarefa atual.`);
    
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
