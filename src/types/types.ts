/*
    Ruben Agostinho
*/

export type Task_Status = "todo" | "blocked" | "in_progress" | "done"

export interface task{
    id: string;
    status: Task_Status;
    created_at: string;
    end_at: string | null;
    name: string;

    schedule: string | null; //pode não ter schedule
    work_flow: work[] | null;
    task_notes: notes[] | null;

}

export interface work {
    id: string;
    start: string; 
    stop: string | null; 
    duration: number | null; 
}

export interface notes{
    id: string;
    value: string;
    created_at: string;
}