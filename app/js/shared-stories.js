// ============================================
// SHARED STORIES FUNCTIONS
// Funções compartilhadas para feed.html e direct.html
// ============================================

// Função getProxyUrl removida - APIs e proxies removidos

// Função para mascarar username (mostra 3 letras + *****)
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

// Textos para os stories (com blur para direct)
const storyLabels = [
    'Conte as novidades',
    'de olho 👀',
    'ai gente não aguento mais',
    'queria fazer tal coisa..',
    'q tédio',
    'pensando...',
    'alguém??',
    'Que musica top 🔥'
];

// Função para carregar stories do localStorage
function loadStoriesFromCache(username) {
    const PROCESSED_STORIES_KEY = 'processed_stories_' + username;
    const savedStories = localStorage.getItem(PROCESSED_STORIES_KEY);
    
    let allUsers = [];
    if (savedStories) {
        try {
            allUsers = JSON.parse(savedStories);
            // Garantir que as URLs estão corretas
            allUsers = allUsers.map(user => {
                let url = user.profile_pic_url || '';
                // Decodificar URLs de proxy (tanto /proxy-image quanto /image-proxy)
                if (url.includes('/proxy-image?url=')) {
                    try {
                        const urlObj = new URL(url);
                        url = decodeURIComponent(urlObj.searchParams.get('url') || url);
                    } catch (e) {
                        // Se não conseguir decodificar, usar a URL original
                    }
                }
                return {
                    ...user,
                    profile_pic_url: url
                };
            }).filter(user => user.profile_pic_url && user.profile_pic_url.includes('cdninstagram.com'));
        } catch (e) {
            console.error('Erro ao carregar stories do cache:', e);
        }
    }
    return allUsers;
}

// Função para renderizar stories
// Parâmetros:
// - containerId: ID do container (ex: 'stories-container' ou 'storiesContainer')
// - username: username do usuário
// - profilePicUrl: URL da foto de perfil do usuário
// - options: { showLabels: boolean, labelsWithBlur: boolean }
function renderStories(containerId, username, profilePicUrl, options = {}) {
    const {
        showLabels = false,        // Mostrar labels sobre as fotos
        labelsWithBlur = false,    // Se os labels devem ter blur
        containerSelector = null   // Seletor alternativo (para direct)
    } = options;

    const container = containerSelector 
        ? document.querySelector(containerSelector)
        : document.getElementById(containerId);
    
    if (!container) {
        console.error('Container não encontrado:', containerId);
        return;
    }

    if (!username || !profilePicUrl) {
        console.error('Username ou profilePicUrl não fornecidos');
        return;
    }

    // Carregar stories do localStorage
    const allUsers = loadStoriesFromCache(username);

    // Limpar container
    container.innerHTML = '';

    // Story do usuário principal (primeiro)
    const userLabel = showLabels ? storyLabels[0] : '';
    const userLabelBlur = labelsWithBlur ? 'filter: blur(3px); user-select: none;' : '';
    const userStoryHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            ${showLabels ? `
            <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); z-index: 30;">
                <div style="background-color: rgb(43, 48, 54); padding: 6px 10px; border-radius: 12px; box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 6px; max-width: 90px; text-align: center;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: rgb(249, 249, 249); line-height: 1.2; display: block; ${userLabelBlur}">${userLabel}</span>
                </div>
            </div>
            ` : ''}
            <button class="story-button">
                <div style="width: 100%; height: 100%; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, rgb(74, 55, 182), rgb(171, 88, 244));">
                    <div style="width: 100%; height: 100%; border-radius: 50%; background: rgb(11, 16, 20); padding: 2px;">
                        <div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: rgb(31, 41, 55); position: relative;">
                            <img alt="${username}" src="${profilePicUrl}" loading="eager" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    </div>
                </div>
            </button>
            <span class="story-username">${containerId === 'stories-container' ? 'Seu story' : username}</span>
        </div>
    `;
    container.innerHTML += userStoryHTML;

    // Limitar a 15 stories normais (1 do usuário + 14 outros)
    const MAX_STORIES = 15;
    const validStories = allUsers.filter(user => user && user.username && user.profile_pic_url).slice(0, MAX_STORIES - 1);

    // Verificar ordem salva
    const STORIES_ORDER_KEY = 'stories_order_' + username;
    let orderedStories = [...validStories];
    
    const storedOrder = localStorage.getItem(STORIES_ORDER_KEY);
    const currentUsernames = validStories.map(s => s.username).sort().join(',');
    
    if (storedOrder) {
        try {
            const savedOrder = JSON.parse(storedOrder);
            const savedUsernames = savedOrder.map(s => s.username).sort().join(',');
            
            if (savedUsernames === currentUsernames) {
                const usernameToStory = {};
                validStories.forEach(s => usernameToStory[s.username] = s);
                orderedStories = savedOrder.map(s => usernameToStory[s.username]).filter(Boolean);
            }
        } catch (e) {
            console.error('Erro ao parsear ordem dos stories:', e);
        }
    }
    
    // Se não tem ordem salva ou mudou, criar nova
    if (orderedStories.length !== validStories.length || 
        orderedStories.map(s => s.username).sort().join(',') !== currentUsernames) {
        // Embaralhar os stories aleatoriamente
        for (let i = orderedStories.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [orderedStories[i], orderedStories[j]] = [orderedStories[j], orderedStories[i]];
        }
        localStorage.setItem(STORIES_ORDER_KEY, JSON.stringify(orderedStories.map(s => ({ username: s.username }))));
                    }

    // Renderizar stories normais
    const storiesHTML = orderedStories.map((user, index) => {
        const maskedUsername = maskUsername(user.username);
        const labelIndex = showLabels ? ((index % (storyLabels.length - 1)) + 1) : -1;
        const label = labelIndex >= 0 ? storyLabels[labelIndex] : '';
        const labelBlur = labelsWithBlur ? 'filter: blur(3px); user-select: none;' : '';
        
        return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                ${showLabels && label ? `
                <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); z-index: 30;">
                    <div style="background-color: rgb(43, 48, 54); padding: 6px 10px; border-radius: 12px; box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 6px; max-width: 90px; text-align: center;">
                        <span style="font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: rgb(249, 249, 249); line-height: 1.2; display: block; ${labelBlur}">${label}</span>
                    </div>
                </div>
                ` : ''}
                <button class="story-button">
                    <div style="width: 100%; height: 100%; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, rgb(74, 55, 182), rgb(171, 88, 244));">
                        <div style="width: 100%; height: 100%; border-radius: 50%; background: rgb(11, 16, 20); padding: 2px;">
                            <div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: rgb(31, 41, 55); position: relative;">
                                <img alt="${maskedUsername}" src="${user.profile_pic_url}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        </div>
                    </div>
                </button>
                <span class="story-username">${maskedUsername}</span>
            </div>
        `;
    }).join('');
    container.innerHTML += storiesHTML;

    // Duplicar apenas 5 stories com blur e cadeado no final
    const MAX_BLURRED_STORIES = 5;
    const blurredStories = orderedStories.slice(0, MAX_BLURRED_STORIES);
    const usernameLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    
    const blurredStoriesHTML = blurredStories.map((user, index) => {
        const randomLetter = usernameLetters[index % usernameLetters.length] || usernameLetters[Math.floor(Math.random() * usernameLetters.length)];
        const maskedUsername = randomLetter + '******';
        const labelIndex = showLabels ? ((index % (storyLabels.length - 1)) + 1) : -1;
        const label = labelIndex >= 0 ? storyLabels[labelIndex] : '';
        const labelBlur = labelsWithBlur ? 'filter: blur(3px); user-select: none;' : '';
        
        return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;${index === blurredStories.length - 1 ? ' padding-right: 32px;' : ''}">
                ${showLabels && label ? `
                <div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); z-index: 30;">
                    <div style="background-color: rgb(43, 48, 54); padding: 6px 10px; border-radius: 12px; box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 6px; max-width: 90px; text-align: center;">
                        <span style="font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: rgb(249, 249, 249); line-height: 1.2; display: block; ${labelBlur}">${label}</span>
                    </div>
                </div>
                ` : ''}
                <button class="story-button">
                    <div style="width: 100%; height: 100%; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, rgb(74, 55, 182), rgb(171, 88, 244));">
                        <div style="width: 100%; height: 100%; border-radius: 50%; background: rgb(11, 16, 20); padding: 2px;">
                            <div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: rgb(55, 65, 81); position: relative; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);">
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; z-index: 10;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </button>
                <span class="story-username">${maskedUsername}</span>
            </div>
        `;
    }).join('');
    container.innerHTML += blurredStoriesHTML;
}
