// src/io/storage.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { task } from '../types/types'; //

// Define o caminho: ~/.taskr/data.json
const DATA_DIR = path.join(os.homedir(), '.taskr');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Garante que a pasta e o ficheiro existem
function ensureFileExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}

// Lê todas as tarefas
export function loadTasks(): task[] {
    ensureFileExists();
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent) as task[];
    } catch (error) {
        console.error("Erro ao ler o ficheiro de tarefas:", error);
        return [];
    }
}

// Guarda a lista de tarefas
export function saveTasks(tasks: task[]): void {
    ensureFileExists();
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
    } catch (error) {
        console.error("Erro ao guardar a tarefa:", error);
    }
}