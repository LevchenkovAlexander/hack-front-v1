export async function postTask(task: any) {
    try {
        const res = await fetch('/api/task', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(task),
        });
        
        if (!res.ok) {
            throw new Error('Request failed');
        }
        return await res.json();
    } catch (e) {
        console.error('Failed to post task:', e);
        throw e;
    }
}

export async function postFreeHours(freeHoursRequest: {freeHours: number, Uid: Long}) {
    try {
        const res = await fetch('/api/free-hours', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(freeHoursRequest),
        });
        
        if (!res.ok) {
            throw new Error('Request failed');
        }
        return await res.json();
    } catch (e) {
        console.error('Failed to post free hours:', e);
        throw e;
    }
}

export async function postResult(resultRequest: {Uid: Long, number: number, percent: number}) {
    try {
        const res = await fetch('/api/result', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(resultRequest),
        });
        
        if (!res.ok) {
            throw new Error('Request failed');
        }
        return await res.json();
    } catch (e) {
        console.error('Failed to post result:', e);
        throw e;
    }
}

export async function generateOrderApi(generateOrderRequest: {tasks: any[], Uid: Long}) {
    try {
        const res = await fetch('/api/generate-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(generateOrderRequest),
        });
        return res;
    } catch (e) {
        console.error('Failed to generate order:', e);
        throw e;
    }
}
