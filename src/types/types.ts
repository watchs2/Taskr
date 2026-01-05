/*
    Ruben Agostinho
*/

type Task_Status = "todo" | "blocked" | "in_progress" | "done"

interface task{
    id: string;
    status: Task_Status;
    created_at: string;
    end_at: string | null;
    name: string;

    schedule: string | null; //pode não ter schedule
    work_flow: work[] | null;
    task_notes: notes[] | null;

}

interface work{
    id: string;
    start: string; //ISO
    stop: string; //ISO
    duration: string; //mins
}

interface notes{
    id: string;
    value: string;
    created_at: string;
}