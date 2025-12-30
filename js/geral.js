// ============================================
// ARQUIVO GERAL - FUNÇÕES E CONFIGURAÇÕES COMPARTILHADAS
// ============================================

// ============================================
// VERIFICAR SE TIMER EXPIROU - REDIRECT IMEDIATO PARA CTA
// ============================================
(function() {
    // Não executar no CTA (para não criar loop)
    if (window.location.pathname.includes('cta.html')) return;
    
    // Verificar se timer expirou - REDIRECT IMEDIATO
    if (localStorage.getItem('cta_timer_expired') === '1') {
        // Redirecionar IMEDIATAMENTE para CTA preservando UTMs
        const currentUrl = new URL(window.location.href);
        const ctaUrl = new URL('./cta.html', window.location.href);
        
        currentUrl.searchParams.forEach((value, key) => {
            if (key.startsWith('utm_') || key === 'src') {
                ctaUrl.searchParams.set(key, value);
            }
        });
        
        // Substituir no histórico para não poder voltar
        window.location.replace(ctaUrl.href);
        return; // Parar execução
    }
})();

// ============================================
// CONFIGURAÇÕES DO SITE
// ============================================
const SITE_CONFIG = {
    name: "Meustalker",
    fullName: "Stalkea.ai - O maior software de espionagem de Instagram da América Latina",
    description: "Stalkea.ai - O maior software de espionagem de Instagram da América Latina. Descubra a verdade sobre qualquer pessoa do Instagram.",
    apiPort: 8002,
    defaultPort: 8001
    // redirectUrl removido - não há mais lógica de redirecionamento
};

// Funções de cookie removidas

// ============================================
// FUNÇÃO DE LIMPEZA COMPLETA DE DADOS
// ============================================

/**
 * Limpa TODOS os dados armazenados: localStorage, sessionStorage, IndexedDB
 */
function clearAllData() {
    // 1. Limpar localStorage completamente (incluindo chaves específicas)
    try {
        const prefixes = ['feed', 'direct', 'processed_stories', 'user_data', 
                          'followers', 'following', 'chaining_results', 'posts',
                          'feedPostsOrder', 'feedPostsHash', 'feed_real_posts',
                          'feed_posts_html', 'feed_timestamp', 'last_searched_username'];
        
        Object.keys(localStorage).forEach(key => {
            if (prefixes.some(prefix => key.includes(prefix))) {
                localStorage.removeItem(key);
            }
        });
        
        localStorage.clear();
    } catch (e) {
        console.error('❌ Erro ao limpar localStorage:', e);
    }
    
    // 2. Limpar sessionStorage completamente
    try {
        sessionStorage.clear();
    } catch (e) {
        console.error('❌ Erro ao limpar sessionStorage:', e);
    }
    
    // Cookies e cache removidos
    
    // 4. Tentar limpar IndexedDB (se existir)
    try {
        if ('indexedDB' in window) {
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    if (db.name) {
                        indexedDB.deleteDatabase(db.name).catch(() => {});
                    }
                });
            }).catch(() => {});
        }
    } catch (e) {
        // Silencioso
    }
    
    // Cache removido
}

// ============================================
// FUNÇÕES PARA GERAR DADOS ALEATÓRIOS
// ============================================

/**
 * Gera um nome aleatório
 * @returns {string} - Nome aleatório
 */
function generateRandomName() {
    const firstNames = ['Ana', 'Maria', 'João', 'Pedro', 'Carlos', 'Julia', 'Fernanda', 'Lucas', 'Gabriel', 'Mariana', 'Rafael', 'Beatriz', 'Thiago', 'Camila', 'Bruno', 'Isabela', 'Larissa', 'André', 'Amanda'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Barbosa'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

/**
 * Gera um username aleatório (mais realista)
 * @returns {string} - Username aleatório
 */
function generateRandomUsername() {
    const firstNames = ['ana', 'maria', 'joao', 'pedro', 'carlos', 'julia', 'fernanda', 'lucas', 'gabriel', 'mariana', 'rafael', 'beatriz', 'thiago', 'camila', 'bruno', 'isabela', 'larissa', 'andre', 'amanda', 'sophia', 'enzo', 'valentina', 'benjamin', 'helena', 'arthur', 'alice', 'theo', 'laura', 'davi'];
    const lastNames = ['silva', 'santos', 'oliveira', 'pereira', 'costa', 'rodrigues', 'almeida', 'nascimento', 'lima', 'araujo', 'fernandes', 'carvalho', 'gomes', 'martins', 'rocha', 'ribeiro', 'alves', 'monteiro', 'barbosa'];
    const separators = ['.', '_', ''];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const separator = separators[Math.floor(Math.random() * separators.length)];
    const numbers = Math.random() > 0.7 ? Math.floor(Math.random() * 99) : ''; // 30% chance de ter números
    return `${firstName}${separator}${lastName}${numbers}`;
}

/**
 * Gera uma URL de foto aleatória
 * @returns {string} - URL de foto aleatória
 */
function generateRandomPhotoUrl() {
    // Retornar perfil-sem-foto.jpeg como padrão
    // Se quiser usar imagens aleatórias, pode retornar uma URL aleatória
    // Mas por padrão, retornar a foto padrão
    return '../imagens/perfil-sem-foto.jpeg';
}

/**
 * Gera dados de usuário aleatórios
 * @param {number} count - Quantidade de usuários
 * @returns {Array} - Array de usuários aleatórios
 */
function generateRandomUsers(count = 10) {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push({
            username: generateRandomUsername(),
            full_name: generateRandomName(),
            profile_pic_url: '../imagens/perfil-sem-foto.jpeg',
            profile_pic_url_hd: '../imagens/perfil-sem-foto.jpeg',
            pk: String(Math.floor(Math.random() * 1000000000)),
            id: String(Math.floor(Math.random() * 1000000000)),
            follower_count: Math.floor(Math.random() * 5000),
            following_count: Math.floor(Math.random() * 1000),
            media_count: Math.floor(Math.random() * 500)
        });
    }
    return users;
}

// APIs e proxies removidos
// Verificações de cookie removidas - código limpo

// ============================================
// FUNÇÕES DE NAVEGAÇÃO COM UTM
// ============================================

/**
 * Redireciona para CTA preservando parâmetros UTM
 * @param {string} page - Página destino (default: 'cta.html')
 */
function goToCTA(page = 'cta.html') {
    const currentParams = window.location.search;
    const newUrl = page + currentParams;
    window.location.href = newUrl;
}

/**
 * Retorna URL do CTA com parâmetros UTM preservados
 * @param {string} page - Página destino (default: 'cta.html')
 * @returns {string} - URL completa com parâmetros
 */
function getCTAUrl(page = 'cta.html') {
    const currentParams = window.location.search;
    return page + currentParams;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Mascara um username (mostra 3 letras + *****)
 * @param {string} username - Username a mascarar
 * @returns {string} - Username mascarado
 */
function maskUsername(username) {
    if (!username || username.length === 0) {
        return 'xxx*****';
    }
    
    // Remover emojis e caracteres especiais, mantendo apenas letras, números, . e _
    const cleanUsername = username.replace(/[^\w.]/g, '');
    
    // Se o username já contém asteriscos, extrair as letras antes dos asteriscos
    if (cleanUsername.includes('*')) {
        const lettersOnly = cleanUsername.split('*')[0];
        if (lettersOnly.length >= 3) {
            return lettersOnly.substring(0, 3) + '*****';
        } else if (lettersOnly.length > 0) {
            return lettersOnly + '*****';
        }
        return 'xxx*****';
    }
    
    // Se após limpeza não sobrou nada, retornar padrão
    if (cleanUsername.length === 0) {
        return 'xxx*****';
    }
    
    // Mostrar 3 letras + *****
    const visibleChars = cleanUsername.length >= 3 ? cleanUsername.substring(0, 3) : cleanUsername;
    return visibleChars + '*****';
}

/**
 * Formata um número (ex: 1000 -> 1K, 1000000 -> 1M)
 * @param {number} num - Número a formatar
 * @returns {string} - Número formatado
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ============================================
// EXPORTAR FUNÇÕES (para compatibilidade)
// ============================================

// Tornar funções disponíveis globalmente
if (typeof window !== 'undefined') {
    window.SITE_CONFIG = SITE_CONFIG;
    window.clearAllData = clearAllData;
    window.maskUsername = maskUsername;
    window.formatNumber = formatNumber;
    window.generateRandomName = generateRandomName;
    window.generateRandomUsername = generateRandomUsername;
    window.generateRandomPhotoUrl = generateRandomPhotoUrl;
    window.generateRandomUsers = generateRandomUsers;
    window.goToCTA = goToCTA;
    window.getCTAUrl = getCTAUrl;
}
