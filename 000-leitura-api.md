// Importa as funções do módulo core (addItem, getItems, updateItem, removeItem)
import todo from "./core.ts";

// Cria e configura o servidor HTTP com Bun
const server = Bun.serve({
  port: 3000, // Servidor vai rodar na porta 3000

  routes: {
    // Rota raiz — serve o arquivo HTML da pasta public
    "/": new Response(Bun.file("./public/index.html")),

    // Rotas da API de todo (sem índice)
    "/api/todo": {

      // GET /api/todo — retorna todos os itens da lista
      GET: async () => {
        const items = await todo.getItems()
        return Response.json(items)               // Responde com o array em JSON
      },

      // POST /api/todo — adiciona um novo item à lista
      POST: async (req) => {
        const data = await req.json() as any;     // Lê o corpo da requisição como JSON
        const item = data.item || null;           // Pega o campo "item", ou null se ausente
        if (!item)                                // Valida se o item foi enviado
          return Response.json('Por favor, forneça um item para adicionar.', { status: 400 });
        await todo.addItem(item);                 // Adiciona o item na lista
        return Response.json(data);              // Retorna os dados recebidos como confirmação
      },
    },

    // Rotas da API de todo com índice dinâmico (:index)
    "/api/todo/:index": {

      // PUT /api/todo/:index — atualiza o item no índice informado
      PUT: async (req) => {
        const index = parseInt(req.params.index);         // Converte o parâmetro para número
        if (isNaN(index))                                 // Valida se é um número válido
          return Response.json('Índice inválido. um número inteiro é esperado.', { status: 400 });
        const data = await req.json() as any;             // Lê o corpo da requisição
        const newItem = data.newItem || null;             // Pega o novo valor, ou null se ausente
        if (!newItem)                                     // Valida se o novo item foi enviado
          return Response.json('Por favor, forneça um novo item para atualizar.', { status: 400 });
        try {
          await todo.updateItem(index, newItem);          // Atualiza o item no índice
          return Response.json(`Item no índice ${index} atualizado para "${newItem}".`);
        } catch (error: any) {
          return Response.json(error.message, { status: 400 }); // Índice fora dos limites
        }
      },

      // DELETE /api/todo/:index — remove o item no índice informado
      DELETE: async (req) => {
        const index = parseInt(req.params.index);         // Converte o parâmetro para número
        if (isNaN(index))                                 // Valida se é um número válido
          return Response.json('Índice inválido.', { status: 400 });
        try {
          await todo.removeItem(index);                   // Remove o item no índice
          return Response.json(`Item no índice ${index} removido com sucesso.`);
        } catch (error: any) {
          return Response.json(error.message, { status: 400 }); // Índice fora dos limites
        }
      },
    },

    // ── EXEMPLO BÁSICO ──────────────────────────────────────────────────────

    "/api/exemplo": {

      // GET /api/exemplo — retorna uma string com o timestamp atual
      GET: () => {
        return new Response(`Esse é o exemplo: ${Date.now()}`)
      },

      // POST /api/exemplo — devolve o JSON recebido acrescido da data atual
      POST: async (req) => {
        const data = await req.json() as any;
        data.recebidoEm = new Date().toLocaleDateString("pt-BR"); // Adiciona data no objeto
        return Response.json(data);
      },
    },

    // Rotas de exemplo com parâmetro dinâmico (:id)
    "/api/exemplo/:id": {

      // PUT /api/exemplo/:id — substitui o recurso, adicionando id e data
      PUT: async (req, params) => {
        const { id } = req.params;                                // Pega o id da URL
        const data = await req.json() as any;
        data.id = id;                                             // Injeta o id no objeto
        data.recebidoEm = new Date().toLocaleDateString("pt-BR");
        return Response.json(data);
      },

      // PATCH /api/exemplo/:id — atualização parcial; lista quais chaves foram enviadas
      PATCH: async (req, params) => {
        const { id } = req.params;
        const data = await req.json() as any;
        data.chavesAtualizadas = Object.keys(data); // Registra quais campos chegaram
        data.id = id;
        data.atualizadoEm = new Date().toLocaleDateString("pt-BR");
        return Response.json(data);
      },

      // DELETE /api/exemplo/:id — simula a remoção de um recurso pelo id
      DELETE: (req, params) => {
        const { id } = req.params;
        return new Response(`Recurso com id ${id} deletado`, { status: 200 });
      }
    }
    // ── FIM DO EXEMPLO BÁSICO ────────────────────────────────────────────────
  },

  // Fallback — responde 404 para qualquer rota não definida acima
  async fetch(req) {
    return new Response(`Not Found`, { status: 404 });
  },
});

// Exibe no terminal o endereço onde o servidor está rodando
console.log(`Server running at http://localhost:${server.port}`);

// Caminho completo para o arquivo JSON temporário (na mesma pasta do script)
const jsonFilePath = __dirname + '/data.temp.json';

// Carrega a lista do arquivo ao iniciar; se falhar, começa com lista vazia
const list: string[] = await loadFromFile();


// Lê o arquivo JSON e retorna seu conteúdo como array de strings
async function loadFromFile() {
  try {
    const file = Bun.file(jsonFilePath);       // Abre o arquivo
    const content = await file.text();         // Lê o conteúdo como texto
    return JSON.parse(content) as string[];    // Converte JSON para array e retorna
  } catch (error: any) {
    if (error.code === 'ENOENT')               // Se o arquivo não existir...
      return [];                               // ...retorna array vazio (primeiro uso)
    throw error;                               // Qualquer outro erro, lança a exceção
  }
}


// Salva o estado atual da lista no arquivo JSON
async function saveToFile() {
  try {
    await Bun.write(jsonFilePath, JSON.stringify(list)); // Converte array para JSON e grava
  } catch (error: any) {
    throw new Error("Erro ao salvar os dados no arquivo: " + error.message); // Erro ao gravar
  }
}


// Adiciona um item ao final da lista e salva
async function addItem(item: string) {
  list.push(item);       // Insere o item na lista em memória
  await saveToFile();    // Persiste a mudança no arquivo
}


// Retorna todos os itens da lista
async function getItems() {
  return list; // Simplesmente devolve o array em memória
}


// Atualiza o item de um índice específico e salva
async function updateItem(index: number, newItem: string) {
  if (index < 0 || index >= list.length)        // Valida se o índice existe
    throw new Error("Index fora dos limites");
  list[index] = newItem;   // Substitui o item no índice informado
  await saveToFile();      // Persiste a mudança no arquivo
}


// Remove o item de um índice específico e salva
async function removeItem(index: number) {
  if (index < 0 || index >= list.length)        // Valida se o índice existe
    throw new Error("Index fora dos limites");
  list.splice(index, 1);   // Remove 1 elemento a partir do índice informado
  await saveToFile();      // Persiste a mudança no arquivo
}


// Exporta apenas as funções públicas (loadFromFile e saveToFile ficam internas)
export default { addItem, getItems, updateItem, removeItem };
