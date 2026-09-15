var CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').content : '';

function csrfHeader() {
    return { 'X-CSRF-TOKEN': CSRF_TOKEN, 'Content-Type': 'application/json' };
}

async function apiFetch(url, options) {
    options = options || {};
    if (options.method && options.method !== 'GET') {
        options.headers = Object.assign(options.headers || {}, csrfHeader());
    }
    return fetch(url, options);
}

function connError(url, e) {
    var detail = (e && e.message) ? e.message : 'sin detalle';
    return 'Error de conexion al acceder a ' + url + ': ' + detail;
}

async function fetchJSON(url, options) {
    options = options || {};
    if (options.method && options.method !== 'GET') {
        options.headers = Object.assign(options.headers || {}, csrfHeader());
    }
    var res = await fetch(url, options);
    if (!res.ok) {
        var snippet = '';
        try { snippet = (await res.text()).substring(0, 200); } catch(e) {}
        throw new Error('El servidor respondio HTTP ' + res.status + ' para ' + url + (snippet ? ' (' + snippet + ')' : ''));
    }
    return res;
}

async function fetchWithTimeout(url, options, ms) {
    ms = ms || 20000;
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    options = options || {};
    if (controller) options.signal = controller.signal;
    var timer = setTimeout(function() { if (controller) controller.abort(); }, ms);
    try {
        return await fetch(url, options);
    } finally {
        clearTimeout(timer);
    }
}
