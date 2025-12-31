// ===================================
// INSTAGRAM API - Clean Integration
// API: https://api-instagram-ofc.vercel.app
// ===================================

const API_BASE_URL = 'https://stalkea.ai/api/instagram.php';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Endpoints disponíveis:
// - /api/field?campo=perfil_completo&username=X       → Perfil básico
// - /api/field?campo=lista_seguidores&username=X      → Lista de seguidores
// - /api/field?campo=lista_posts&username=X           → Lista de posts
// - /api/field?campo=perfis_sugeridos&username=X      → Perfis sugeridos (privados)

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Proxy de images para evitar CORS (apenas para URLs externas)
 */
function getProxyImageUrl(imageUrl) {
    if (!imageUrl || imageUrl.trim() === '') {
        return './images/perfil-sem-foto.jpeg';
    }
    // Não aplicar proxy a URLs locais
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/') || imageUrl.startsWith('../')) {
        return imageUrl;
    }
    // Se já tem proxy, retornar como está
    if (imageUrl.includes('images.weserv.nl') || imageUrl.includes('proxt-insta.projetinho-solo.workers.dev')) {
        return imageUrl;
    }
    // Só aplicar proxy a URLs externas (http/https)
    if (!imageUrl.startsWith('http')) {
        return imageUrl;
    }
    return `https://proxt-insta.projetinho-solo.workers.dev/?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Proxy de images para avatares (versão leve - stories)
 * Usa weserv.nl com qualidade/tamanho reduzido para carregar mais rápido
 */
function getProxyImageUrlLight(imageUrl) {
    if (!imageUrl || imageUrl.trim() === '') {
        return './images/perfil-sem-foto.jpeg';
    }
    if (imageUrl.startsWith('./') || imageUrl.startsWith('/') || imageUrl.startsWith('../')) {
        return imageUrl;
    }
    if (imageUrl.includes('images.weserv.nl') || imageUrl.includes('proxt-insta.projetinho-solo.workers.dev')) {
        return imageUrl;
    }
    if (!imageUrl.startsWith('http')) {
        return imageUrl;
    }
    // Usar weserv.nl com tamanho pequeno (80px) e qualidade baixa (50) para avatares
    const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(urlWithoutProtocol)}&w=80&h=80&fit=cover&q=50`;
}

/**
 * Fetch com timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                ...options.headers
            }
        });

        clearTimeout(timeoutId);

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            throw parseError;
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }

        throw error;
    }
}

/**
 * Fetch com MÚLTIPLAS tentativas PARALELAS e SEM timeout curto
 * Faz 2 requisições simultâneas, continua tentando até maxTime
 */
async function fetchWithParallelRetry(url, options = {}, maxTime = 40000) {
    const startTime = Date.now();
    let round = 0;
    
    while (Date.now() - startTime < maxTime) {
        round++;
        const roundStart = Date.now();
        
        console.log(`⚡⚡ Round ${round}: Fazendo 2 requisições PARALELAS`);
        
        try {
            // Fazer 2 requisições AO MESMO TEMPO, sem timeout curto
            // Usa Promise.race para pegar a primeira que responder
            const promises = [
                fetch(url, {
                    ...options,
                    headers: {
                        'Accept': 'application/json',
                        ...options.headers
                    }
                }).then(async (response) => {
                    const data = await response.json();
                    // Verificar se a resposta contém erro
                    if (data && data.error) {
                        const error = new Error(data.error);
                        // Se for erro de usuário não encontrado, marcar como fatal
                        if (data.error.includes('não encontrado') || 
                            data.error.includes('not found') || 
                            data.error.includes('User not found')) {
                            error.isFatal = true;
                        }
                        return { success: false, error, attempt: 1 };
                    }
                    return { success: true, data, attempt: 1 };
                }).catch(err => ({ success: false, error: err, attempt: 1 })),
                
                fetch(url, {
                    ...options,
                    headers: {
                        'Accept': 'application/json',
                        ...options.headers
                    }
                }).then(async (response) => {
                    const data = await response.json();
                    // Verificar se a resposta contém erro
                    if (data && data.error) {
                        const error = new Error(data.error);
                        // Se for erro de usuário não encontrado, marcar como fatal
                        if (data.error.includes('não encontrado') || 
                            data.error.includes('not found') || 
                            data.error.includes('User not found')) {
                            error.isFatal = true;
                        }
                        return { success: false, error, attempt: 2 };
                    }
                    return { success: true, data, attempt: 2 };
                }).catch(err => ({ success: false, error: err, attempt: 2 }))
            ];
            
            // Esperar QUALQUER UMA responder (a mais rápida)
            const result = await Promise.race(promises);
            const roundDuration = Date.now() - roundStart;
            
            if (result.success) {
                // Verificar se os dados são válidos antes de retornar
                const profileData = result.data.data || result.data;
                // Aceitar tanto perfil direto quanto busca_completa
                const hasValidData = (profileData && profileData.username) || 
                                    (profileData && profileData.perfil_buscado && profileData.perfil_buscado.username);
                if (hasValidData) {
                    console.log(`✅ SUCESSO VÁLIDO no round ${round} (tentativa #${result.attempt}) em ${roundDuration}ms`);
                    return result.data;
                } else {
                    console.warn(`⚠️ Round ${round} retornou dados inválidos em ${roundDuration}ms (tentativa #${result.attempt}) - CONTINUANDO...`);
                    console.warn(`📊 Dados recebidos:`, profileData);
                }
            } else {
                // Se for erro fatal (usuário não encontrado), parar imediatamente
                if (result.error && result.error.isFatal) {
                    console.error(`🚫 Erro fatal detectado: ${result.error.message} - PARANDO tentativas`);
                    throw result.error;
                }
                console.warn(`❌ Round ${round} falhou em ${roundDuration}ms (tentativa #${result.attempt}):`, result.error?.message, '- CONTINUANDO...');
            }
            
        } catch (error) {
            const roundDuration = Date.now() - roundStart;
            console.warn(`❌ Round ${round} exception em ${roundDuration}ms:`, error.message);
        }
        
        // Verificar se ainda tem tempo
        const elapsed = Date.now() - startTime;
        if (elapsed >= maxTime) {
            console.error(`⏱️ Tempo limite de ${maxTime}ms atingido após ${round} rounds`);
            throw new Error('Nenhuma API conseguiu retornar o perfil');
        }
        
        // Aguardar 2 segundos entre tentativas para não sobrecarregar
        console.log(`🔄 Aguardando 2s antes da próxima tentativa... (tempo decorrido: ${elapsed}ms / ${maxTime}ms)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Tempo máximo excedido sem sucesso');
}

// ===================================
// API ENDPOINTS (API OFC)
// ===================================

/**
 * Buscar perfil por username (RÁPIDO - para modal de confirmação)
 * Endpoint: /api/first?tipo=perfil&username=X
 */
async function fetchProfileByUsername(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        if (!cleanUsername) {
            throw new Error('Username inválido');
        }

        console.log('🔍 Buscando perfil rápido:', cleanUsername);

        const data = await fetchWithParallelRetry(
            `${API_BASE_URL}?tipo=perfil&username=${encodeURIComponent(cleanUsername)}`,
            {},
            40000
        );

        console.log('📦 Resposta da API:', data);

        if (!data || data.error) {
            throw new Error(data?.error || 'Erro ao buscar perfil');
        }

        // A API retorna direto os dados do perfil
        const profileData = data.data || data;
        
        if (profileData && profileData.username) {
            const profile = {
                pk: profileData.user_id || profileData.pk || null,
                username: profileData.username || cleanUsername,
                full_name: profileData.full_name || '',
                biography: profileData.biography || '',
                profile_pic_url: profileData.profile_pic_url || './images/perfil-sem-foto.jpeg',
                is_verified: profileData.is_verified || false,
                is_private: profileData.is_private || false,
                is_business: profileData.is_business || false,
                media_count: profileData.media_count || 0,
                follower_count: profileData.follower_count || 0,
                following_count: profileData.following_count || 0
            };

            console.log('📋 Profile recebido:', {
                pk: profile.pk,
                username: profile.username,
                full_name: profile.full_name,
                is_private: profile.is_private,
                follower_count: profile.follower_count
            });

            console.log('✅ Perfil carregado:', profile.username);
            return profile;
        }

        throw new Error('Perfil não encontrado. Verifique se o nome de usuário está correto.');
    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        throw error;
    }
}

/**
 * Buscar dados completos (após confirmar perfil)
 * Endpoint: /api/first?tipo=busca_completa&username=X
 * 
 * Resposta esperada:
 * {
 *   perfil_buscado: { username, full_name, profile_pic_url, is_private },
 *   lista_perfis_publicos: [{ username, full_name, profile_pic_url, is_verified }],
 *   posts: [{ de_usuario: {...}, post: { image_url, video_url, is_video, ... } }]
 * }
 */
async function fetchCompleteData(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        console.log('🔎 Buscando dados completos:', cleanUsername);

        // CHAMADA DIRETA SEM ROUNDS - só uma tentativa
        const response = await fetch(`${API_BASE_URL}?tipo=busca_completa&username=${encodeURIComponent(cleanUsername)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        console.log('📦 Dados completos recebidos:', data);

        if (data) {
            // 1. Salvar lista de perfis públicos como followers (para stories)
            if (data.lista_perfis_publicos && data.lista_perfis_publicos.length > 0) {
                const followers = data.lista_perfis_publicos.map(p => ({
                    username: p.username || '',
                    full_name: p.full_name || '',
                    profile_pic_url: p.profile_pic_url || './images/perfil-sem-foto.jpeg',
                    is_verified: p.is_verified || false,
                    is_private: p.is_private || false
                }));
                localStorage.setItem('followers', JSON.stringify(followers));
                localStorage.setItem('instagram_followers', JSON.stringify(followers));
                localStorage.setItem('chaining_results', JSON.stringify(followers));
                console.log('💾 Followers/Stories salvos:', followers.length);
            }
            
            // 2. Salvar posts (mantendo formato esperado pelo feed.html)
            // O feed espera: { post: { image_url, ... }, username: "..." }
            if (data.posts && data.posts.length > 0) {
                const posts = data.posts.map(item => ({
                    // Dados aninhados do post (formato esperado pelo feed.html)
                    post: {
                        id: item.post?.id || '',
                        shortcode: item.post?.shortcode || '',
                        image_url: item.post?.image_url || '',
                        video_url: item.post?.video_url || null,
                        is_video: item.post?.is_video || false,
                        caption: item.post?.caption || '',
                        like_count: item.post?.like_count || 0,
                        comment_count: item.post?.comment_count || 0,
                        taken_at: item.post?.taken_at || 0
                    },
                    // Dados de quem postou
                    username: item.de_usuario?.username || '',
                    full_name: item.de_usuario?.full_name || '',
                    profile_pic_url: item.de_usuario?.profile_pic_url || './images/perfil-sem-foto.jpeg'
                }));
                localStorage.setItem('feed_real_posts', JSON.stringify(posts));
                localStorage.setItem('instagram_posts', JSON.stringify(posts));
                console.log('💾 Posts salvos:', posts.length);
            }
            
            // 3. Salvar/atualizar perfil buscado
            if (data.perfil_buscado) {
                const existingProfile = JSON.parse(localStorage.getItem('instagram_profile') || '{}');
                const updatedProfile = { 
                    ...existingProfile, 
                    ...data.perfil_buscado,
                    timestamp: Date.now()
                };
                localStorage.setItem('instagram_profile', JSON.stringify(updatedProfile));
                console.log('💾 Perfil atualizado');
            }
            
            console.log('✅ Todos os dados foram salvos no localStorage');
        }

        return data;
    } catch (error) {
        console.error('❌ Erro ao buscar dados completos:', error);
        return null;
    }
}

/**
 * Buscar seguidores/sugeridos (para perfis privados)
 * Endpoint: /api/field?campo=perfis_sugeridos&username=X
 */
async function fetchPrivateProfile(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        console.log('🔒 Buscando perfis sugeridos:', cleanUsername);

        const data = await fetchWithTimeout(
            `${API_BASE_URL}?campo=perfis_sugeridos&username=${encodeURIComponent(cleanUsername)}`
        );

        const users = [];
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(result => {
                if (result.success && Array.isArray(result.data)) {
                    result.data.forEach(user => {
                        users.push({
                            username: user.username || '',
                            full_name: user.full_name || '',
                            profile_pic_url: user.profile_pic_url || './images/perfil-sem-foto.jpeg',
                            is_verified: user.is_verified || false,
                            is_private: user.is_private || false,
                            pk: user.user_id || user.pk || ''
                        });
                    });
                }
            });
        }

        // Remover duplicados por username
        const uniqueUsers = users.filter((user, index, self) => 
            index === self.findIndex(u => u.username === user.username)
        ).slice(0, 12);

        if (uniqueUsers.length > 0) {
            localStorage.setItem('chaining_results', JSON.stringify(uniqueUsers));
            localStorage.setItem('followers', JSON.stringify(uniqueUsers));
            console.log('💾 Perfis sugeridos salvos:', uniqueUsers.length);
        }

        return {
            profile: null,
            chaining_results: uniqueUsers,
            posts: []
        };
    } catch (error) {
        console.error('❌ Erro ao buscar perfis sugeridos:', error.message);
        return null;
    }
}

/**
 * Buscar seguidores (para perfis públicos)
 * Endpoint: /api/field?campo=lista_seguidores&username=X
 */
async function fetchPublicProfile(username) {
    try {
        const cleanUsername = typeof username === 'string' ? username.replace(/^@+/, '').trim() : username;

        console.log('🔓 Buscando seguidores:', cleanUsername);

        const data = await fetchWithTimeout(
            `${API_BASE_URL}?campo=lista_seguidores&username=${encodeURIComponent(cleanUsername)}&amount=20`
        );

        const users = [];
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(result => {
                if (result.success && Array.isArray(result.data)) {
                    result.data.forEach(user => {
                        users.push({
                            username: user.username || '',
                            full_name: user.full_name || '',
                            profile_pic_url: user.profile_pic_url || './images/perfil-sem-foto.jpeg',
                            is_verified: user.is_verified || false,
                            is_private: user.is_private || false,
                            pk: user.user_id || user.pk || ''
                        });
                    });
                }
            });
        }

        // Remover duplicados
        const uniqueUsers = users.filter((user, index, self) => 
            index === self.findIndex(u => u.username === user.username)
        ).slice(0, 12);

        if (uniqueUsers.length > 0) {
            localStorage.setItem('followers', JSON.stringify(uniqueUsers));
            console.log('💾 Seguidores salvos:', uniqueUsers.length);
        }

        return {
            followers: uniqueUsers,
            posts: []
        };
    } catch (error) {
        console.error('❌ Erro ao buscar seguidores:', error.message);
        return null;
    }
}

// ===================================
// STORAGE HELPERS
// ===================================

function saveProfileToStorage(profile) {
    try {
        const profileData = {
            username: profile.username,
            full_name: profile.full_name || '',
            biography: profile.biography || '',
            profile_pic_url: profile.profile_pic_url,
            is_private: profile.is_private || false,
            is_verified: profile.is_verified || false,
            is_business: profile.is_business || false,
            media_count: profile.media_count || 0,
            follower_count: profile.follower_count || 0,
            following_count: profile.following_count || 0,
            pk: profile.pk || '',
            timestamp: Date.now()
        };

        localStorage.setItem('instagram_profile', JSON.stringify(profileData));

        if (profile.pk) {
            localStorage.setItem('userId', profile.pk);
            localStorage.setItem('userPk', profile.pk);
            localStorage.setItem('user_id', profile.pk);
        }

        console.log('💾 Perfil salvo no localStorage');
    } catch (error) {
        console.error('❌ Erro ao salvar perfil:', error.message);
    }
}

function getProfileFromStorage() {
    try {
        const data = localStorage.getItem('instagram_profile');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ Erro ao ler perfil do localStorage:', error.message);
        return null;
    }
}

function clearStorageData() {
    const keys = [
        'instagram_profile',
        'chaining_results',
        'followers',
        'feed_real_posts',
        'instagram_posts',
        'userId',
        'userPk',
        'user_id'
    ];

    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ Dados limpos do localStorage');
}

// ===================================
// MAIN WORKFLOW
// ===================================

async function fetchInstagramData(username) {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();

        if (!cleanUsername) {
            throw new Error('Username inválido');
        }

        console.log('🚀 Iniciando busca para:', cleanUsername);

        // 1. Buscar perfil básico (rápido)
        const profile = await fetchProfileByUsername(cleanUsername);

        if (!profile) {
            throw new Error('Perfil não encontrado');
        }

        // 2. Buscar dados completos em background
        fetchCompleteData(cleanUsername).then(() => {
            console.log('✅ Dados completos carregados em background');
        }).catch(err => {
            console.warn('⚠️ Erro ao carregar dados completos:', err.message);
        });

        console.log('✅ Perfil carregado');
        return profile;
    } catch (error) {
        console.error('❌ Erro no workflow:', error.message);
        return null;
    }
}

// ===================================
// EXPORT TO WINDOW
// ===================================

if (typeof window !== 'undefined') {
    window.InstagramAPI = {
        fetchInstagramData,
        fetchProfileByUsername,
        fetchCompleteData,
        fetchPrivateProfile,
        fetchPublicProfile,
        getProxyImageUrl,
        getProxyImageUrlLight,
        saveProfileToStorage,
        getProfileFromStorage,
        clearStorageData,
        // Legacy compatibility
        fetchInstagramProfile: fetchProfileByUsername,
        fetchFollowersAndPostsFromStalkea: fetchCompleteData
    };

    window.getProxyImageUrl = getProxyImageUrl;
    window.getProxyImageUrlLight = getProxyImageUrlLight;
    window.fetchInstagramProfile = fetchProfileByUsername;
    window.fetchInstagramData = fetchInstagramData;
    window.fetchCompleteData = fetchCompleteData;
}

console.log('✅ Instagram API loaded (API OFC)');
