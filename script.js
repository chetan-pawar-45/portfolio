
/* ════════════════════════════════════════════
   1. THREE.JS 3D FLOATING GEOMETRY BACKGROUND
════════════════════════════════════════════ */
(function init3DBg() {
    const canvas = document.getElementById('bgCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // Wireframe shapes
    const shapes = [];
    const geometries = [
        new THREE.IcosahedronGeometry(0.6, 0),
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.TetrahedronGeometry(0.5, 0),
        new THREE.IcosahedronGeometry(0.4, 0),
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.TetrahedronGeometry(0.4, 0),
        new THREE.IcosahedronGeometry(0.3, 0),
        new THREE.OctahedronGeometry(0.55, 0),
    ];

    geometries.forEach((geo, i) => {
        const mat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x00c9ff : 0x0072ff,
            wireframe: true,
            transparent: true,
            opacity: 0.12 + Math.random() * 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 6 - 2
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rotX: (Math.random() - 0.5) * 0.008,
            rotY: (Math.random() - 0.5) * 0.008,
            floatY: Math.random() * Math.PI * 2,
            floatSpeed: 0.003 + Math.random() * 0.003,
        };
        scene.add(mesh);
        shapes.push(mesh);
    });

    // Floating particles (points)
    const pGeo = new THREE.BufferGeometry();
    const pCount = 200;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) {
        pPos[i] = (Math.random() - 0.5) * 20;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00c9ff, size: 0.04, transparent: true, opacity: 0.4 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
    });

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        shapes.forEach(m => {
            m.rotation.x += m.userData.rotX;
            m.rotation.y += m.userData.rotY;
            m.position.y += Math.sin(t * m.userData.floatSpeed + m.userData.floatY) * 0.002;
        });

        points.rotation.y = t * 0.02;
        points.rotation.x = t * 0.01;

        // Smooth camera parallax
        camera.position.x += (mouseX - camera.position.x) * 0.03;
        camera.position.y += (-mouseY - camera.position.y) * 0.03;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }
    animate();
})();


/* ════════════════════════════════════════════
   2. INTERACTIVE PARTICLE SYSTEM
════════════════════════════════════════════ */
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    let mouseX = W / 2, mouseY = H / 2;

    canvas.width = W;
    canvas.height = H;
    window.addEventListener('resize', () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });

    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

    const PARTICLE_COUNT = 80;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
    }));

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Connect nearby particles
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            // Mouse repulsion
            const dx = p.x - mouseX, dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                p.vx += dx / dist * 0.06;
                p.vy += dy / dist * 0.06;
            }

            // Damping
            p.vx *= 0.995;
            p.vy *= 0.995;

            // Wrap around
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;

            // Draw dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,201,255,${p.alpha})`;
            ctx.fill();

            // Connect to nearby
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = `rgba(0,201,255,${0.07 * (1 - d / 100)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(draw);
    }
    draw();
})();


/* ════════════════════════════════════════════
   3. ADVANCED CANVAS CURSOR — BULLETPROOF
════════════════════════════════════════════ */
(function initCursor() {
    const canvas = document.getElementById('cursorCanvas');
    if (!canvas) { console.warn('cursorCanvas not found'); return; }

    const ctx = canvas.getContext('2d');

    // Force canvas on top of everything
    canvas.style.cssText = [
        'position:fixed',
        'top:0', 'left:0',
        'width:100vw', 'height:100vh',
        'pointer-events:none',
        'z-index:2147483647',
        'display:block',
    ].join(';');

    // Size the bitmap correctly
    let W, H;
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // State
    let mouse = { x: W / 2, y: H / 2 };
    let dot = { x: W / 2, y: H / 2 };
    let ring = { x: W / 2, y: H / 2 };
    let trail = [];
    let isHovering = false;
    let isVisible = false;
    let isClicking = false;

    // Track mouse
    document.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (!isVisible) {
            dot.x = ring.x = mouse.x;
            dot.y = ring.y = mouse.y;
            isVisible = true;
        }
    }, { passive: true });

    document.addEventListener('mousedown', () => { isClicking = true; });
    document.addEventListener('mouseup', () => { isClicking = false; });

    // Hide default cursor on entire page
    document.documentElement.style.cursor = 'none';
    const noCursorStyle = document.createElement('style');
    noCursorStyle.textContent = '*, *::before, *::after { cursor: none !important; }';
    document.head.appendChild(noCursorStyle);

    // Hover detection
    const HOVER_SEL = 'a, button, input, textarea, select, label, .project-card, .interest-card, .tech-icon-card, .contact-card, .skill-bar-item, .timeline-card, #scrollTop, [role="button"]';
    document.addEventListener('mouseover', e => {
        isHovering = !!e.target.closest(HOVER_SEL);
    }, { passive: true });

    // ── Draw loop ──
    function draw() {
        requestAnimationFrame(draw);
        ctx.clearRect(0, 0, W, H);
        if (!isVisible) return;

        // Smooth lerp
        const dotLerp = 0.88;
        const ringLerp = 0.10;
        dot.x += (mouse.x - dot.x) * dotLerp;
        dot.y += (mouse.y - dot.y) * dotLerp;
        ring.x += (mouse.x - ring.x) * ringLerp;
        ring.y += (mouse.y - ring.y) * ringLerp;

        // — Comet trail —
        trail.push({ x: dot.x, y: dot.y, life: 1.0 });
        if (trail.length > 22) trail.shift();
        trail.forEach(t => {
            t.life -= 0.045;
            if (t.life <= 0) return;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 3 * t.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,201,255,${t.life * 0.25})`;
            ctx.fill();
        });

        const clickScale = isClicking ? 0.72 : 1;
        const dotR = (isHovering ? 11 : 6) * clickScale;
        const ringR = (isHovering ? 38 : 24) * clickScale;

        const orange = isHovering;

        // — Outer ring —
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = orange ? 'rgba(255,100,0,0.85)' : 'rgba(0,201,255,0.75)';
        ctx.lineWidth = orange ? 2.5 : 1.8;
        ctx.stroke();

        // — Ring outer glow —
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ringR + 5, 0, Math.PI * 2);
        ctx.strokeStyle = orange ? 'rgba(255,100,0,0.18)' : 'rgba(0,201,255,0.12)';
        ctx.lineWidth = 10;
        ctx.stroke();

        // — Inner dot with radial gradient —
        const dotGrad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dotR);
        dotGrad.addColorStop(0, '#ffffff');
        dotGrad.addColorStop(1, orange ? '#ff6400' : '#00c9ff');
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = dotGrad;
        ctx.fill();

        // — Dot glow halo —
        const haloGrad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dotR + 8);
        haloGrad.addColorStop(0, orange ? 'rgba(255,100,0,0.40)' : 'rgba(0,201,255,0.40)');
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotR + 8, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();
    }

    draw();
})();


/* ════════════════════════════════════════════
   4. TYPING ANIMATION
════════════════════════════════════════════ */
(function typeWriter() {
    const roles = [
        'Web Developer 💻',
        'UI/UX Designer 🎨',
        'Frontend Engineer ⚡',
        'Creative Coder 🚀',
        'Open Source Enthusiast 🌍'
    ];
    const el = document.getElementById('roleText');
    if (!el) return;
    let rIdx = 0, cIdx = 0, deleting = false;
    function type() {
        const current = roles[rIdx];
        if (deleting) {
            el.textContent = current.substring(0, cIdx--);
            if (cIdx < 0) { deleting = false; rIdx = (rIdx + 1) % roles.length; setTimeout(type, 400); return; }
            setTimeout(type, 50);
        } else {
            el.textContent = current.substring(0, cIdx++);
            if (cIdx > current.length) { deleting = true; setTimeout(type, 2000); return; }
            setTimeout(type, 90);
        }
    }
    type();
})();


/* ════════════════════════════════════════════
   5. NAVBAR
════════════════════════════════════════════ */
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    const links = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');
    function onScroll() {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        let current = '';
        sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - 120) current = sec.id; });
        links.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${current}`) a.classList.add('active');
        });
        const btn = document.getElementById('scrollTop');
        if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    links.forEach(a => a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open')));
})();


/* ════════════════════════════════════════════
   6. HAMBURGER
════════════════════════════════════════════ */
document.getElementById('hamburger').addEventListener('click', function () {
    document.getElementById('navLinks').classList.toggle('open');
    this.classList.toggle('active');
});


/* ════════════════════════════════════════════
   7. SCROLL REVEAL
════════════════════════════════════════════ */
(function initReveal() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();


/* ════════════════════════════════════════════
   8. SKILL BAR ANIMATION
════════════════════════════════════════════ */
(function initSkillBars() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animated'); obs.unobserve(e.target); } });
    }, { threshold: 0.3 });
    document.querySelectorAll('.skill-fill').forEach(el => obs.observe(el));
})();


/* ════════════════════════════════════════════
   9. SCROLL TO TOP
════════════════════════════════════════════ */
document.getElementById('scrollTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


/* ════════════════════════════════════════════
   10. CONTACT FORM
════════════════════════════════════════════ */
(function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        let valid = true;
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const subject = document.getElementById('subject');
        const message = document.getElementById('message');
        ['nameError', 'emailError', 'messageError'].forEach(id => document.getElementById(id).textContent = '');
        if (!name.value.trim()) { document.getElementById('nameError').textContent = 'Please enter your name.'; valid = false; }
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) { document.getElementById('emailError').textContent = 'Please enter your email.'; valid = false; }
        else if (!emailRe.test(email.value)) { document.getElementById('emailError').textContent = 'Please enter a valid email.'; valid = false; }
        if (!message.value.trim() || message.value.trim().length < 10) { document.getElementById('messageError').textContent = 'Message must be at least 10 characters.'; valid = false; }
        if (!valid) return;
        const btn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const success = document.getElementById('formSuccess');
        btn.disabled = true;
        btnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        // If opened as a file (no server), use mailto fallback
        if (window.location.protocol === 'file:') {
            const mailBody = `Name: ${name.value.trim()}%0D%0AEmail: ${email.value.trim()}%0D%0A%0D%0A${message.value.trim()}`;
            const mailSubject = subject.value.trim() || 'Portfolio Contact';
            window.open(`mailto:chetanpawar0780@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${mailBody}`);
            success.style.display = 'flex';
            form.reset();
            btn.disabled = false;
            btnText.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
            setTimeout(() => success.style.display = 'none', 5000);
            return;
        }

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.value.trim(),
                    email: email.value.trim(),
                    subject: subject.value.trim(),
                    message: message.value.trim(),
                }),
            });
            const data = await res.json();

            if (data.success) {
                success.style.display = 'flex';
                form.reset();
                setTimeout(() => success.style.display = 'none', 5000);
            } else {
                // Show server-side validation errors
                if (data.errors) {
                    data.errors.forEach(err => {
                        const errEl = document.getElementById(err.field + 'Error');
                        if (errEl) errEl.textContent = err.message;
                    });
                } else {
                    alert(data.message || 'Something went wrong. Please try again.');
                }
            }
        } catch (err) {
            console.error('Contact form error:', err);
            // Fallback: open mailto if server is not reachable
            const mailBody = `Name: ${name.value.trim()}%0D%0AEmail: ${email.value.trim()}%0D%0A%0D%0A${message.value.trim()}`;
            const mailSubject = subject.value.trim() || 'Portfolio Contact';
            window.open(`mailto:chetanpawar0780@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${mailBody}`);
            success.style.display = 'flex';
            form.reset();
            setTimeout(() => success.style.display = 'none', 5000);
        } finally {
            btn.disabled = false;
            btnText.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
        }
    });
})();


/* ════════════════════════════════════════════
   11. SMOOTH ANCHOR SCROLL
════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        }
    });
});


/* ════════════════════════════════════════════
   12. COUNTER ANIMATION
════════════════════════════════════════════ */
(function initCounters() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const end = parseInt(el.textContent);
            const suffix = el.textContent.replace(/[0-9]/g, '');
            let cur = 0;
            const step = end / 40;
            const timer = setInterval(() => {
                cur = Math.min(cur + step, end);
                el.textContent = Math.ceil(cur) + suffix;
                if (cur >= end) clearInterval(timer);
            }, 30);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.pstat strong').forEach(el => obs.observe(el));
})();


/* ════════════════════════════════════════════
   13. 3D CARD TILT (Profile card + project cards)
════════════════════════════════════════════ */
(function initTilt() {
    function addTilt(el, intensity = 15) {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            el.style.transform = `perspective(1000px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(10px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
            el.style.transition = 'transform 0.5s ease';
        });
        el.addEventListener('mouseenter', () => { el.style.transition = 'transform 0.1s ease'; });
    }

    const profileCard = document.getElementById('profileCard');
    if (profileCard) addTilt(profileCard, 12);

    document.querySelectorAll('.project-card').forEach(card => addTilt(card, 8));
    document.querySelectorAll('.edu-card').forEach(card => addTilt(card, 6));
})();


/* ════════════════════════════════════════════
   14. MAGNETIC BUTTONS
════════════════════════════════════════════ */
(function initMagnetic() {
    document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) translateY(-3px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
        });
        btn.addEventListener('mouseenter', () => { btn.style.transition = 'transform 0.1s ease'; });
    });
})();


/* ════════════════════════════════════════════
   15. SECTION ENTRANCE STAGGER
════════════════════════════════════════════ */
(function initStagger() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const children = entry.target.querySelectorAll('.interest-card, .tech-icon-card, .edu-stat-card');
            children.forEach((child, i) => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    child.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    child.style.opacity = '1';
                    child.style.transform = 'translateY(0)';
                }, i * 80);
            });
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.about-interests, .tech-icons, .edu-stats').forEach(el => obs.observe(el));
})();


/* ════════════════════════════════════════════
   16. CLICK RIPPLE EFFECT
════════════════════════════════════════════ */
document.addEventListener('click', e => {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    width: 0; height: 0;
    border-radius: 50%;
    background: rgba(0,201,255,0.3);
    transform: translate(-50%,-50%);
    pointer-events: none;
    z-index: 99998;
    animation: rippleOut 0.6s ease forwards;
  `;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

// Ripple keyframe
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes rippleOut {
    to { width: 100px; height: 100px; opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);