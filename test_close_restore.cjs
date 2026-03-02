const http = require('http');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8090,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    const preview = await request('GET', '/api/payroll/preview');
    console.log("PREVIEW: ", JSON.stringify(preview).substring(0, 100));

    const close = await request('POST', '/api/payroll/close', {});
    console.log("CLOSE: ", close);

    if (close.runId) {
        const restore = await request('POST', '/api/payroll/restore?runId=' + close.runId, {});
        console.log("RESTORE: ", restore);
    }
}
run();
