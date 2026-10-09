const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
const MAX_BODY_BYTES = 16 * 1024;
const MAX_REQUESTS_PER_MINUTE = 8;
const requestCounts = new Map();

loadLocalEnv();
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/health" && request.method === "GET") {
    return sendJson(response, 200, { status: "ok" });
  }

  if (url.pathname === "/api/config" && request.method === "GET") {
    const whatsappNumber = (process.env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
    return sendJson(response, 200, {
      whatsappNumber: /^\d{8,15}$/.test(whatsappNumber) ? whatsappNumber : "",
    });
  }

  if (url.pathname === "/api/contact") {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return sendJson(response, 405, { error: "Método não permitido." });
    }

    if (!isRateLimited(request.socket.remoteAddress)) {
      return sendJson(response, 429, {
        error: "Muitas tentativas. Aguarde um minuto e tente novamente.",
      });
    }

    if (!request.headers["content-type"]?.includes("application/json")) {
      return sendJson(response, 415, { error: "O formulário precisa ser enviado em JSON." });
    }

    try {
      const body = await readJsonBody(request);
      const lead = validateLead(body);
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      await fs.promises.appendFile(LEADS_FILE, `${JSON.stringify(lead)}\n`, {
        encoding: "utf8",
        flag: "a",
      });
      return sendJson(response, 201, { message: "Contato recebido com sucesso." });
    } catch (error) {
      if (error instanceof RequestError) {
        return sendJson(response, error.status, { error: error.message });
      }
      console.error("Falha ao salvar contato:", error);
      return sendJson(response, 500, { error: "Não foi possível salvar o contato agora." });
    }
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return sendJson(response, 405, { error: "Método não permitido." });
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.resolve(ROOT, `.${requestedPath}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    return sendJson(response, 403, { error: "Acesso negado." });
  }

  try {
    const content = await fs.promises.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' https://images.unsplash.com https://images.pexels.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    return response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      return sendJson(response, 404, { error: "Página não encontrada." });
    }
    console.error("Falha ao servir arquivo:", error);
    return sendJson(response, 500, { error: "Não foi possível carregar a página." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Nocaute CT disponível em http://localhost:${PORT}`);
});

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    request.setEncoding("utf8");

    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        reject(new RequestError(413, "O formulário é maior do que o permitido."));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new RequestError(400, "Os dados enviados não são válidos."));
      }
    });
    request.on("error", reject);
  });
}

function validateLead(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError(400, "Os dados enviados não são válidos.");
  }

  const name = cleanText(body.name, 80);
  const phone = cleanText(body.phone, 30);
  const className = cleanText(body.className, 30);
  const message = cleanText(body.message || "", 500);
  const allowedClasses = ["Boxe", "Muay Thai", "Personal Fight", "Ainda não sei"];
  const phoneDigits = phone.replace(/\D/g, "");

  if (name.length < 2) throw new RequestError(400, "Informe seu nome.");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    throw new RequestError(400, "Informe um número de WhatsApp válido.");
  }
  if (!allowedClasses.includes(className)) {
    throw new RequestError(400, "Selecione uma modalidade válida.");
  }

  return {
    name,
    phone,
    className,
    message,
    createdAt: new Date().toISOString(),
  };
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, maxLength);
}

function isRateLimited(address) {
  const now = Date.now();
  const recentRequests = (requestCounts.get(address) || []).filter(
    (timestamp) => now - timestamp < 60_000,
  );
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    requestCounts.set(address, recentRequests);
    return false;
  }
  recentRequests.push(now);
  requestCounts.set(address, recentRequests);
  return true;
}

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
