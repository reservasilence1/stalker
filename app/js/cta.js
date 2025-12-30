// ============================================
// CTA.JS - Scripts otimizados para página CTA
// ============================================

(function() {
    'use strict';

    // ====== MATRIX BACKGROUND - CÓDIGO IGUAL AO INDEX.HTML ======
    (function() {
        const canvas = document.getElementById('matrix-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let animationId = null;
        let isPaused = false;
        
        function initCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        initCanvas();
        
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZ0123456789';
        const fontSize = 14;
        let columns = Math.floor(canvas.width / fontSize);
        let drops = Array(columns).fill(1);
        
        function recalculateColumns() {
            columns = Math.floor(canvas.width / fontSize);
            drops = Array(columns).fill(1);
        }
        
        function draw() {
            if (isPaused) return;
            
            ctx.fillStyle = 'rgba(4, 6, 7, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillStyle = i % 2 === 0 ? 'rgba(74, 55, 182, 0.5)' : 'rgba(171, 88, 244, 0.5)';
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            
            animationId = requestAnimationFrame(draw);
        }
        
        function startAnimation() {
            if (!isPaused && !animationId) {
                animationId = requestAnimationFrame(draw);
            }
        }
        
        function pauseAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            isPaused = true;
        }
        
        function resumeAnimation() {
            isPaused = false;
            startAnimation();
        }
        
        // Pausar quando aba não está visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAnimation();
            } else {
                resumeAnimation();
            }
        });
        
        // Redimensionar canvas
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                initCanvas();
                recalculateColumns();
            }, 250);
        });
        
        // Iniciar animação
        startAnimation();
    })();

    // ====== ANIMAÇÃO DE DIGITAÇÃO PARA TOOL-TITLE ======
    (function() {
        const toolTitle = document.querySelector('.tool-title[data-typing="true"]');
        if (!toolTitle) return;

        const originalHTML = toolTitle.innerHTML.trim();
        toolTitle.innerHTML = '';

        function typeText(element, html, speed = 30) {
            let index = 0;
            let currentHTML = '';
            let insideTag = false;
            
            function type() {
                if (index < html.length) {
                    if (html[index] === '<') {
                        insideTag = true;
                        const closeIndex = html.indexOf('>', index);
                        if (closeIndex !== -1) {
                            currentHTML += html.substring(index, closeIndex + 1);
                            index = closeIndex + 1;
                            element.innerHTML = currentHTML;
                            setTimeout(type, 5);
                            return;
                        }
                    }
                    currentHTML += html[index];
                    element.innerHTML = currentHTML;
                    index++;
                    setTimeout(type, speed);
                }
            }
            type();
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    typeText(toolTitle, originalHTML, 45);
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(toolTitle);
    })();

    // ====== COUNTDOWN OTIMIZADO - SINCRONIZADO COM FEED ======
    (function() {
        const PREVIEW_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos
        const STORAGE_KEY = 'previewStartTime';
        const EXPIRED_KEY = 'timerExpired';
        let countdownInterval = null;
        
        function showExpiredState() {
            const timerBar = document.querySelector('.timer-bar');
            const countdownEl = document.getElementById('countdown');
            
            if (timerBar) {
                timerBar.classList.add('expired');
            }
            
            if (countdownEl) {
                countdownEl.textContent = '0:00';
            }
            
            // Alterar textos quando zerado
            const timerParagraph = timerBar ? timerBar.querySelector('p') : null;
            if (timerParagraph) {
                timerParagraph.innerHTML = '<strong style="font-weight: 900;">Finalize sua compra agora!</strong><br><span style="display: inline-block; margin-top: 3px;">Não saia ou recarregue essa página, a espionagem não pode ser realizada novamente.</span>';
            }
        }
        
        function updateCountdown() {
            const countdownEl = document.getElementById('countdown');
            if (!countdownEl) return;
            
            // Verificar se já expirou permanentemente
            if (localStorage.getItem(EXPIRED_KEY) === 'true') {
                showExpiredState();
                clearInterval(countdownInterval);
                countdownInterval = null;
                return;
            }
            
            // Buscar tempo inicial do localStorage (mesmo usado no feed)
            let startTime = localStorage.getItem(STORAGE_KEY);
            
            if (!startTime) {
                // Se não existe, criar agora (primeira vez no cta)
                startTime = Date.now();
                localStorage.setItem(STORAGE_KEY, startTime.toString());
            } else {
                startTime = parseInt(startTime);
            }
            
            const elapsed = Date.now() - startTime;
            const remaining = PREVIEW_DURATION - elapsed;
            
            if (remaining <= 0) {
                // Marcar como expirado permanentemente
                localStorage.setItem(EXPIRED_KEY, 'true');
                showExpiredState();
                
                clearInterval(countdownInterval);
                countdownInterval = null;
                return;
            }
            
            const totalSeconds = Math.floor(remaining / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Atualizar sempre (para mostrar segundos)
            countdownEl.textContent = formattedTime;
        }
        
        function startCountdown() {
            // Se já expirou, mostrar estado expirado
            if (localStorage.getItem(EXPIRED_KEY) === 'true') {
                showExpiredState();
                return;
            }
            
            if (countdownInterval) return;
            
            updateCountdown(); // Primeira atualização imediata
            countdownInterval = setInterval(() => {
                updateCountdown();
            }, 1000);
        }
        
        function pauseCountdown() {
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
        }
        
        // Pausar quando aba não está visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseCountdown();
            } else {
                startCountdown();
            }
        });
        
        // Iniciar countdown
        startCountdown();
    })();
    
    // ====== AUTO-SLIDER DEPOIMENTOS OTIMIZADO ======
    (function() {
        let currentSlide = 0;
        let sliderInterval = null;
        const dots = document.querySelectorAll('.dot');
        
        if (dots.length === 0) return;
        
        function updateSlider() {
            dots.forEach(d => d.classList.remove('active'));
            currentSlide = (currentSlide + 1) % dots.length;
            dots[currentSlide].classList.add('active');
        }
        
        function startSlider() {
            if (sliderInterval) return;
            
            sliderInterval = setInterval(updateSlider, 4000);
        }
        
        function pauseSlider() {
            if (sliderInterval) {
                clearInterval(sliderInterval);
                sliderInterval = null;
            }
        }
        
        // Pausar quando aba não está visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseSlider();
            } else {
                startSlider();
            }
        });
        
        // Iniciar slider
        startSlider();
    })();
    
    // ====== ATUALIZAR USERNAME ======
    (function() {
        function updateUsernames() {
        const profileUsernameElement = document.querySelector('.profile-card-username');
            let nameToUse = null;
        
            if (profileUsernameElement) {
        const fullName = profileUsernameElement.textContent.trim();
                if (fullName && fullName.length > 0) {
                    // Pegar apenas o primeiro nome (primeira palavra antes do espaço)
                    const nameParts = fullName.split(/\s+/);
                    nameToUse = nameParts[0].trim();
                }
            }
            
            // Se não encontrou nome, usar fallback
            if (!nameToUse || nameToUse.length === 0) {
                nameToUse = null;
            }
        
        const usernameElements = document.querySelectorAll('.username-display');
        usernameElements.forEach(function(element) {
                if (nameToUse) {
                    // Substituir o conteúdo, mantendo apenas o primeiro nome
                    element.textContent = nameToUse;
                } else {
                    // Usar fallback se não houver nome
                    const fallback = element.getAttribute('data-fallback') || 'ele (a)';
                    element.textContent = fallback;
                }
            });
        }
        
        // Executar quando DOM estiver pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                updateUsernames();
                // Executar novamente após um pequeno delay para garantir
                setTimeout(updateUsernames, 200);
            });
        } else {
            updateUsernames();
            // Executar novamente após um pequeno delay para garantir
            setTimeout(updateUsernames, 200);
        }
        
        // Executar também quando a página estiver completamente carregada
        window.addEventListener('load', function() {
            setTimeout(updateUsernames, 300);
        });
    })();
    
    // ====== FAQ ACCORDION (NOVA VERSÃO) ======
    (function() {
        function initFAQ() {
            const faqButtons = document.querySelectorAll('.faq-new-btn');
            
            faqButtons.forEach(function(button) {
                button.addEventListener('click', function() {
                    const faqItem = this.closest('.faq-new-item');
                    const isActive = faqItem.classList.contains('active');
                    
                    // Fechar todos os outros itens
                    document.querySelectorAll('.faq-new-item').forEach(function(item) {
                        item.classList.remove('active');
                    });
                    
                    // Abrir/fechar o item clicado
                    if (!isActive) {
                        faqItem.classList.add('active');
                    }
                });
            });
        }
        
        // Executar quando DOM estiver pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initFAQ);
        } else {
            initFAQ();
        }
    })();
    
})();
