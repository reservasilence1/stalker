// ===================================
// MATRIX CANVAS - STALKEA.AI (CONTÍNUO E FLUIDO)
// ===================================

(function() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Config
    const chars = 'STALKEAR.online';
    const fontSize = 13;
    
    // Setup canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const columns = Math.floor(canvas.width / fontSize);
    let drops = [];
    
    // Inicializar posições aleatórias (tela já preenchida)
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
    }
    
    ctx.font = fontSize + 'px monospace';
    
    function draw() {
        // Fade suave - cria o efeito de rastro
        ctx.fillStyle = 'rgba(4, 6, 7, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < columns; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            
            // Cores alternadas com transparência
            ctx.fillStyle = i % 2 === 0 ? 'rgba(74, 55, 182, 0.9)' : 'rgba(171, 88, 244, 0.9)';
            ctx.fillText(char, fontSize * i, fontSize * drops[i]);
            
            // Mover para baixo
            drops[i]++;
            
            // Reiniciar no topo com probabilidade aleatória
            if (fontSize * drops[i] > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
        }
    }
    
    // Animação contínua com requestAnimationFrame para fluidez máxima
    let lastTime = 0;
    const fps = 30; // 30 FPS para performance
    const frameInterval = 1000 / fps;
    
    function animate(currentTime) {
        if (currentTime - lastTime >= frameInterval) {
            draw();
            lastTime = currentTime;
        }
        requestAnimationFrame(animate);
    }
    
    // Iniciar
    requestAnimationFrame(animate);
    
    // Pausar quando a aba não está visível
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            lastTime = performance.now();
        }
    });
    
    // Redimensionar
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.font = fontSize + 'px monospace';
        
        const newColumns = Math.floor(canvas.width / fontSize);
        drops = [];
        for (let i = 0; i < newColumns; i++) {
            drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
        }
    });
})();
