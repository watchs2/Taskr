// src/io/storage.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { task } from '../types/types'; //

// Tenta usar um caminho compartilhado entre contas
// No Windows: C:\ProgramData\Taskr (compartilhado)
// No Linux/Mac: ~/.local/share/Taskr (tentativa, pode falhar em multi-user)
function getSharedDataPath(): string {
    const platform = os.platform();
    
    if (platform === 'win32') {
        // Windows: tenta usar ProgramData (compartilhado entre usuários)
        // Se falhar por permissões, usa AppData do usuário atual
        const programData = process.env['ProgramData'] || 'C:\\ProgramData';
        const sharedDir = path.join(programData, 'Taskr');
        
        // Verifica se conseguimos criar/acessar a pasta
        try {
            if (!fs.existsSync(sharedDir)) {
                fs.mkdirSync(sharedDir, { recursive: true });
            }
            // Testa se conseguimos escrever
            const testFile = path.join(sharedDir, '.test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return sharedDir;
        } catch (error) {
            // Se falhar, usa AppData do usuário (não é compartilhado, mas funciona)
            const appData = process.env['APPDATA'] || os.homedir();
            return path.join(appData, 'Taskr');
        }
    } else {
        // Linux/Mac: tenta usar /var/local (compartilhado) ou /usr/local/share
        // Se falhar, usa ~/.local/share
        try {
            const sharedDir = '/var/local/Taskr';
            if (!fs.existsSync(sharedDir)) {
                fs.mkdirSync(sharedDir, { recursive: true, mode: 0o755 });
            }
            // Testa escrita
            const testFile = path.join(sharedDir, '.test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return sharedDir;
        } catch (error) {
            // Fallback para diretório local do usuário
            return path.join(os.homedir(), '.local', 'share', 'Taskr');
        }
    }
}

// Define o caminho de dados (compartilhado quando possível)
const DATA_DIR = getSharedDataPath();
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