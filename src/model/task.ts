
// src/model/task.ts
import { loadTasks, saveTasks } from '../io/storage';
import { task,Task_Status,work } from '../types/types';
import * as crypto from 'crypto';

export function createTask(name: string, schedule: string | null = null): void {
    const tasks = loadTasks();
    const newId = getNextId(tasks); // A função que criámos antes

    const newTask: task = {
        id: newId,
        name: name,
        status: "todo",
        created_at: new Date().toISOString(),
        end_at: null,
        schedule: schedule, // Guarda a data passada (deve vir em YYYY-MM-DD)
        work_flow: [],
        task_notes: []
    };

    tasks.push(newTask);
    saveTasks(tasks);
    
    const msgSchedule = schedule ? ` [Agendado: ${schedule}]` : '';
    console.log(`[SUCESSO] Tarefa criada: "${newTask.name}"${msgSchedule}`);
}

function getNextId(tasks: task[]): string {
    if (tasks.length === 0) {
        return "1";
    }

    // Encontra o maior ID numérico atual
    const maxId = tasks.reduce((max, t) => {
        const currentId = parseInt(t.id, 10);
        // Só considera se for um número válido e maior que o máximo atual
        return !isNaN(currentId) && currentId > max ? currentId : max;
    }, 0);

    return (maxId + 1).toString();
}

export function taskScheduleToday(): void {
    const tasks = loadTasks();
    
    if (!tasks || tasks.length === 0) {
        console.log(`[INFO] Não existem tarefas registadas.`);
        return;
    }
    
    // Obtém a data de hoje no formato YYYY-MM-DD (parte inicial do ISO)
    const today = new Date().toISOString().split('T')[0];

    const tasksToday = tasks.filter(t => {
        // Verifica se tem schedule e se a string começa com a data de hoje
        return t.schedule && t.schedule.startsWith(today);
    });

    if (tasksToday.length === 0) {
        console.log(`[INFO] Não há tarefas agendadas para hoje (${today}).`);
    } else {
        console.log(`\n=== 📅 Tarefas para Hoje (${today}) ===`);
        tasksToday.forEach(t => printTask(t));
    }
}

export function listAllTasks(): void {
    const tasks = loadTasks();

    if (!tasks || tasks.length === 0) {
        console.log(`[INFO] A lista de tarefas está vazia.`);
        return;
    }

    console.log(`\n=== 🗂️  Todas as Tarefas ===`);
    tasks.forEach(t => printTask(t));
}

function printTask(t: task): void {
    // Formata o estado para ficar mais bonito (ex: [TODO] ou [DONE])
    const statusTag = `[${t.status.toUpperCase()}]`;
    
    // Mostra data se existir
    const dateInfo = t.schedule ? ` 🗓️  ${t.schedule}` : '';

    console.log(`${statusTag} #${t.id} - ${t.name}${dateInfo}`);
}

// --- Função Auxiliar: Get Task By ID ---
export function getTaskById(id: string): task | null {
    const tasks = loadTasks();
    const found = tasks.find(t => t.id === id);
    return found || null;
}

// --- Função Principal: Start Task ---
export function startTask(idOrName: string): void {
    const tasks = loadTasks();
    
    // Tenta encontrar pelo ID
    let taskIndex = tasks.findIndex(t => t.id === idOrName);
    
    // Se não encontrar por ID, podes implementar busca por nome aqui (opcional por agora)
    if (taskIndex === -1) {
        console.error(`[ERRO] Tarefa com id "${idOrName}" não encontrada.`);
        return;
    }

    const currentTask = tasks[taskIndex];

    // 1. Atualizar Status (se for 'todo' -> 'in_progress')
    if (currentTask.status === 'todo') {
        currentTask.status = 'in_progress';
    }

    // 2. Inicializar work_flow se for null
    if (!currentTask.work_flow) {
        currentTask.work_flow = [];
    }

    // 3. Verificar se já existe algum work "aberto" (sem stop)
    const hasOpenWork = currentTask.work_flow.find(w => w.stop === null);
    
    if (hasOpenWork) {
        console.log(`[AVISO] A tarefa "${currentTask.name}" já está em execução (desde ${hasOpenWork.start}).`);
        return;
    }

    // 4. Criar novo Chunk de Trabalho
    const newWork: work = {
        id: crypto.randomUUID(), // ID único para este chunk
        start: new Date().toISOString(),
        stop: null,
        duration: null
    };

    currentTask.work_flow.push(newWork);

    // 5. Guardar alterações
    // Como modificámos o objeto dentro do array 'tasks', basta guardar o array 'tasks'
    saveTasks(tasks);

    console.log(`[SUCESSO] Tarefa iniciada: "${currentTask.name}"`);
    console.log(`          Estado: ${currentTask.status}`);
    console.log(`          Hora de início: ${newWork.start}`);
}

export function stopTask(): void {
    const tasks = loadTasks();
    let activeTask = null;
    let activeWork = null;

    // 1. Procurar a tarefa e o work ativo
    for (const task of tasks) {
        if (task.work_flow) {
            const foundWork = task.work_flow.find(w => w.stop === null);
            if (foundWork) {
                activeTask = task;
                activeWork = foundWork;
                break; // Encontrou, pode parar de procurar
            }
        }
    }

    if (!activeTask || !activeWork) {
        console.log(`[INFO] Não há nenhuma tarefa com temporizador ativo no momento.`);
        return;
    }

    // 2. Definir hora de paragem
    const now = new Date();
    activeWork.stop = now.toISOString();

    // 3. Calcular a duração em minutos
    const startTime = new Date(activeWork.start);
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.round(diffMs / 60000); // Converte ms para minutos

    // Nota: Se no teu types.ts 'duration' for string, usa .toString(). Se for number, usa direto.
    // Aqui assumo que seguiste a sugestão anterior de usar number. Caso contrário: diffMins.toString()
    activeWork.duration = diffMins; 

    // 4. (Opcional) Mudar status?
    // Geralmente mantemos "in_progress" até ser feito o "done", 
    // mas se quiseres que volte a "todo" quando paras o tempo, podes descomentar a linha abaixo:
    // activeTask.status = "todo"; 

    saveTasks(tasks);

    console.log(`[SUCESSO] Temporizador parado para a tarefa: "${activeTask.name}"`);
    console.log(`          Duração da sessão: ${diffMins} minutos`);
    console.log(`          Início: ${activeWork.start}`);
    console.log(`          Fim:    ${activeWork.stop}`);
}

// src/model/task.ts

// ... (outros imports)

/**
 * Mostra o status atual: se há alguma tarefa com temporizador a correr
 */
export function showCurrentStatus(): void {
    const tasks = loadTasks();
    let activeTask = null;
    let activeWork = null;

    for (const task of tasks) {
        if (task.work_flow) {
            const foundWork = task.work_flow.find(w => w.stop === null);
            if (foundWork) {
                activeTask = task;
                activeWork = foundWork;
                break;
            }
        }
    }

    if (activeTask && activeWork) {
        const startTime = new Date(activeWork.start);
        const diffMs = new Date().getTime() - startTime.getTime();
        const diffMins = Math.round(diffMs / 60000);

        console.log(`\n[ATIVO] Estás a trabalhar na tarefa: "${activeTask.name}" (#${activeTask.id})`);
        console.log(`        Iniciada em: ${activeWork.start}`);
        console.log(`        Tempo decorrido: ${diffMins} minutos\n`);
    } else {
        console.log(`\n[INFO] Não há nenhuma tarefa em execução de momento.\n`);
    }
}

/**
 * Calcula o tempo total trabalhado no dia de hoje
 */
export function showTodayTotalTime(): void {
    const tasks = loadTasks();
    const today = new Date().toISOString().split('T')[0];
    let totalMinutes = 0;

    tasks.forEach(task => {
        if (task.work_flow) {
            task.work_flow.forEach(work => {
                // Verifica se o bloco de trabalho começou hoje
                if (work.start.startsWith(today) && work.duration) {
                    totalMinutes += work.duration;
                }
            });
        }
    });

    console.log(`\n=== 🕒 Tempo Total Hoje (${today}) ===`);
    console.log(`Total: ${totalMinutes} minutos (${(totalMinutes / 60).toFixed(2)} horas)\n`);
}

/**
 * Marca uma tarefa como concluída
 */
export function markTaskAsDone(id: string): void {
    const tasks = loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
        console.error(`[ERRO] Tarefa com id "${id}" não encontrada.`);
        return;
    }

    // Se estiver a correr, paramos primeiro o tempo
    const activeWork = tasks[taskIndex].work_flow?.find(w => w.stop === null);
    if (activeWork) {
        console.log(`[INFO] Parando temporizador ativo antes de concluir...`);
        stopTask(); // Esta função já grava no ficheiro, por isso recarregamos ou ajustamos
    }

    const tasksReloaded = loadTasks(); // Recarregar para garantir dados do stopTask
    tasksReloaded[taskIndex].status = "done";
    tasksReloaded[taskIndex].end_at = new Date().toISOString();
    
    saveTasks(tasksReloaded);
    console.log(`[SUCESSO] Tarefa #${id} ("${tasksReloaded[taskIndex].name}") marcada como concluída! ✅`);
}