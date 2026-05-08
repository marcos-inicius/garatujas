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