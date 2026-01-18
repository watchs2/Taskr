
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

export function taskScheduleToday(includeDone: boolean = false): void {
    const tasks = loadTasks();
    
    if (!tasks || tasks.length === 0) {
        console.log(`[INFO] Não existem tarefas registadas.`);
        return;
    }
    
    // Obtém a data de hoje no formato YYYY-MM-DD (parte inicial do ISO)
    const today = new Date().toISOString().split('T')[0];

    let tasksToday = tasks.filter(t => {
        // Verifica se tem schedule e se a string começa com a data de hoje
        return t.schedule && t.schedule.startsWith(today);
    });

    // Filtra tarefas done se não incluir
    if (!includeDone) {
        tasksToday = tasksToday.filter(t => t.status !== 'done');
    }

    if (tasksToday.length === 0) {
        console.log(`[INFO] Não há tarefas agendadas para hoje (${today}).`);
    } else {
        console.log(`\n=== 📅 Tarefas para Hoje (${today}) ===`);
        tasksToday.forEach(t => printTask(t));
    }
}

export function listAllTasks(includeDone: boolean = false): void {
    const tasks = loadTasks();

    if (!tasks || tasks.length === 0) {
        console.log(`[INFO] A lista de tarefas está vazia.`);
        return;
    }

    // Filtra tarefas done se não incluir
    const filteredTasks = includeDone ? tasks : tasks.filter(t => t.status !== 'done');

    if (filteredTasks.length === 0) {
        console.log(`[INFO] A lista de tarefas está vazia.`);
        return;
    }

    const title = includeDone ? '🗂️  Todas as Tarefas' : '🗂️  Tarefas Ativas';
    console.log(`\n=== ${title} ===`);
    filteredTasks.forEach(t => printTask(t));
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

// --- Função Auxiliar: Find Task By ID or Name ---
function findTaskByIdOrName(idOrName: string, tasks?: task[]): { task: task; index: number } | null {
    // Se não receber tasks, carrega (para compatibilidade com outras funções)
    const tasksArray = tasks || loadTasks();
    
    // Primeiro tenta encontrar por ID
    let taskIndex = tasksArray.findIndex(t => t.id === idOrName);
    
    if (taskIndex !== -1) {
        return { task: tasksArray[taskIndex], index: taskIndex };
    }
    
    // Se não encontrar, busca por nome (case-insensitive, busca parcial)
    taskIndex = tasksArray.findIndex(t => 
        t.name.toLowerCase().includes(idOrName.toLowerCase()) || 
        idOrName.toLowerCase().includes(t.name.toLowerCase())
    );
    
    if (taskIndex !== -1) {
        return { task: tasksArray[taskIndex], index: taskIndex };
    }
    
    return null;
}

// --- Função Principal: Start Task ---
export function startTask(idOrName: string, createIfNotFound: boolean = false): void {
    const tasks = loadTasks();
    
    // Tenta encontrar pelo ID ou nome (passa o array para evitar recarregar)
    const found = findTaskByIdOrName(idOrName, tasks);
    
    let taskIndex: number;
    
    if (found) {
        taskIndex = found.index;
    } else if (createIfNotFound) {
        // Se não encontrou e pode criar, cria uma nova tarefa
        const newId = getNextId(tasks);
        const newTask: task = {
            id: newId,
            name: idOrName,
            status: "todo",
            created_at: new Date().toISOString(),
            end_at: null,
            schedule: null,
            work_flow: [],
            task_notes: []
        };
        tasks.push(newTask);
        taskIndex = tasks.length - 1;
        console.log(`[INFO] Tarefa criada automaticamente: "${idOrName}"`);
    } else {
        console.error(`[ERRO] Tarefa "${idOrName}" não encontrada.`);
        return;
    }

    // Usa a tarefa diretamente do array para garantir que as mudanças são refletidas
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
export function markTaskAsDone(idOrName: string): void {
    const tasks = loadTasks();
    const found = findTaskByIdOrName(idOrName, tasks);
    
    if (!found) {
        console.error(`[ERRO] Tarefa "${idOrName}" não encontrada.`);
        return;
    }
    
    const taskIndex = found.index;
    const task = tasks[taskIndex];

    // Se estiver a correr, paramos primeiro o tempo
    const activeWork = task.work_flow?.find(w => w.stop === null);
    if (activeWork) {
        console.log(`[INFO] Parando temporizador ativo antes de concluir...`);
        stopTask(); // Esta função já grava no ficheiro, por isso recarregamos ou ajustamos
    }

    const tasksReloaded = loadTasks(); // Recarregar para garantir dados do stopTask
    const reloadedFound = findTaskByIdOrName(idOrName, tasksReloaded);
    
    if (!reloadedFound) {
        console.error(`[ERRO] Tarefa "${idOrName}" não encontrada após recarregar.`);
        return;
    }
    
    tasksReloaded[reloadedFound.index].status = "done";
    tasksReloaded[reloadedFound.index].end_at = new Date().toISOString();
    
    saveTasks(tasksReloaded);
    console.log(`[SUCESSO] Tarefa #${reloadedFound.task.id} ("${reloadedFound.task.name}") marcada como concluída! ✅`);
}

/**
 * Marca uma tarefa como todo (reabre uma tarefa concluída)
 */
export function markTaskAsTodo(idOrName: string): void {
    const tasks = loadTasks();
    const found = findTaskByIdOrName(idOrName, tasks);
    
    if (!found) {
        console.error(`[ERRO] Tarefa "${idOrName}" não encontrada.`);
        return;
    }
    
    const taskIndex = found.index;
    const task = tasks[taskIndex];
    
    // Se estiver a correr, paramos primeiro o tempo
    if (task.work_flow) {
        const activeWork = task.work_flow.find(w => w.stop === null);
        if (activeWork) {
            console.log(`[INFO] Parando temporizador ativo antes de reabrir...`);
            stopTask();
            // Recarrega tasks após stop
            const tasksReloaded = loadTasks();
            const reloadedFound = findTaskByIdOrName(idOrName, tasksReloaded);
            if (reloadedFound) {
                tasksReloaded[reloadedFound.index].status = "todo";
                tasksReloaded[reloadedFound.index].end_at = null;
                saveTasks(tasksReloaded);
                console.log(`[SUCESSO] Tarefa #${reloadedFound.task.id} ("${reloadedFound.task.name}") reaberta! 🔄`);
            }
            return;
        }
    }
    
    task.status = "todo";
    task.end_at = null;
    
    saveTasks(tasks);
    console.log(`[SUCESSO] Tarefa #${task.id} ("${task.name}") reaberta! 🔄`);
}

/**
 * Edita uma tarefa: nome e/ou schedule
 */
export function editTask(idOrName: string, newName?: string, newSchedule?: string | null): void {
    const tasks = loadTasks();
    const found = findTaskByIdOrName(idOrName, tasks);
    
    if (!found) {
        console.error(`[ERRO] Tarefa "${idOrName}" não encontrada.`);
        return;
    }
    
    const taskIndex = found.index;
    const task = tasks[taskIndex];
    
    if (newName !== undefined) {
        task.name = newName;
    }
    
    if (newSchedule !== undefined) {
        task.schedule = newSchedule;
    }
    
    saveTasks(tasks);
    
    const scheduleInfo = task.schedule ? ` [Agendado: ${task.schedule}]` : '';
    console.log(`[SUCESSO] Tarefa editada: "${task.name}"${scheduleInfo}`);
}

/**
 * Formata minutos para string legível (ex: "2h 30m" ou "45m")
 */
function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Formata data ISO para formato legível (ex: "14:30")
 */
function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formata data ISO para formato legível (ex: "05/01/2026 14:30")
 */
function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('pt-PT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Mostra visualização detalhada do dia atual
 */
export function showDayReport(date?: string): void {
    const tasks = loadTasks();
    const targetDate = date ? date : new Date().toISOString().split('T')[0];
    
    const dayTasks: Array<{ task: task; work: work }> = [];
    let totalMinutes = 0;
    
    tasks.forEach(task => {
        if (task.work_flow) {
            task.work_flow.forEach(work => {
                if (work.start.startsWith(targetDate) && work.stop && work.duration) {
                    dayTasks.push({ task, work });
                    totalMinutes += work.duration;
                }
            });
        }
    });
    
    // Ordena por hora de início
    dayTasks.sort((a, b) => a.work.start.localeCompare(b.work.start));
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📅 RELATÓRIO DO DIA: ${targetDate}`);
    console.log(`${'='.repeat(70)}`);
    
    if (dayTasks.length === 0) {
        console.log(`\n  Nenhuma atividade registada neste dia.\n`);
        return;
    }
    
    dayTasks.forEach(({ task, work }, index) => {
        const startTime = formatTime(work.start);
        const endTime = formatTime(work.stop!);
        const duration = formatDuration(work.duration!);
        
        console.log(`\n  ${index + 1}. [${duration.padStart(6)}] ${task.name}`);
        console.log(`     📍 ${startTime} → ${endTime}  |  Total: ${duration}`);
    });
    
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  ⏱️  TEMPO TOTAL: ${formatDuration(totalMinutes)} (${(totalMinutes / 60).toFixed(2)} horas)\n`);
}

/**
 * Mostra visualização da semana atual
 */
export function showWeekReport(): void {
    const tasks = loadTasks();
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Domingo
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const weekDays: { [key: string]: Array<{ task: task; work: work }> } = {};
    const weekTotals: { [key: string]: number } = {};
    
    // Inicializa os dias da semana
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        weekDays[dateStr] = [];
        weekTotals[dateStr] = 0;
    }
    
    // Coleta atividades da semana
    tasks.forEach(task => {
        if (task.work_flow) {
            task.work_flow.forEach(work => {
                if (work.stop && work.duration) {
                    const workDate = work.start.split('T')[0];
                    if (weekDays[workDate]) {
                        weekDays[workDate].push({ task, work });
                        weekTotals[workDate] += work.duration;
                    }
                }
            });
        }
    });
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📆 RELATÓRIO DA SEMANA`);
    console.log(`${'='.repeat(70)}\n`);
    
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let weekTotal = 0;
    
    Object.keys(weekDays).sort().forEach((dateStr, index) => {
        const dayName = dayNames[index];
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
        const dayTotal = weekTotals[dateStr];
        weekTotal += dayTotal;
        
        const activities = weekDays[dateStr];
        
        console.log(`  ${dayName} ${formattedDate}  ${'─'.repeat(50)}  ${formatDuration(dayTotal).padStart(8)}`);
        
        if (activities.length === 0) {
            console.log(`     (nenhuma atividade)`);
        } else {
            activities.forEach(({ task, work }) => {
                const startTime = formatTime(work.start);
                const endTime = formatTime(work.stop!);
                const duration = formatDuration(work.duration!);
                console.log(`     • ${task.name.padEnd(35)} ${startTime}→${endTime}  ${duration}`);
            });
        }
        console.log('');
    });
    
    console.log(`${'─'.repeat(70)}`);
    console.log(`  ⏱️  TOTAL DA SEMANA: ${formatDuration(weekTotal)} (${(weekTotal / 60).toFixed(2)} horas)\n`);
}

/**
 * Mostra visualização do mês atual
 */
export function showMonthReport(): void {
    const tasks = loadTasks();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const monthTasks: Array<{ task: task; work: work }> = [];
    let totalMinutes = 0;
    
    tasks.forEach(task => {
        if (task.work_flow) {
            task.work_flow.forEach(work => {
                if (work.stop && work.duration) {
                    const workDate = new Date(work.start);
                    if (workDate.getFullYear() === currentYear && workDate.getMonth() === currentMonth) {
                        monthTasks.push({ task, work });
                        totalMinutes += work.duration;
                    }
                }
            });
        }
    });
    
    // Agrupa por tarefa
    const taskStats: { [taskName: string]: { count: number; totalMinutes: number } } = {};
    
    monthTasks.forEach(({ task, work }) => {
        if (!taskStats[task.name]) {
            taskStats[task.name] = { count: 0, totalMinutes: 0 };
        }
        taskStats[task.name].count++;
        taskStats[task.name].totalMinutes += work.duration!;
    });
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 RELATÓRIO DO MÊS: ${now.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).toUpperCase()}`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Ordena por tempo total
    const sortedTasks = Object.entries(taskStats).sort((a, b) => b[1].totalMinutes - a[1].totalMinutes);
    
    sortedTasks.forEach(([taskName, stats], index) => {
        const percentage = ((stats.totalMinutes / totalMinutes) * 100).toFixed(1);
        console.log(`  ${(index + 1).toString().padStart(2)}. ${taskName.padEnd(40)} ${formatDuration(stats.totalMinutes).padStart(8)}  (${stats.count} sessões, ${percentage}%)`);
    });
    
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  ⏱️  TOTAL DO MÊS: ${formatDuration(totalMinutes)} (${(totalMinutes / 60).toFixed(2)} horas)`);
    console.log(`  📈 Média diária: ${formatDuration(Math.round(totalMinutes / now.getDate()))}\n`);
}