// ==========================================
// CONFIGURAÇÕES INICIAIS E CONSTANTES
// ==========================================
const C = document.getElementById("c");
const X = C.getContext("2d");

const W = 416, RH = 256, OY = 24, CV = 280; // Dimensões da tela e deslocamentos
const TS = 16, CW = 26, CH = 16;            // Tamanho do tile e dimensões do grid da sala

C.width = W;
C.height = CV;
X.imageSmoothingEnabled = false;

// Funções matemáticas utilitárias
const R = (a, b) => Math.random() * (b - a) + a;
const RI = (a, b) => Math.floor(R(a, b + 1));
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

// ==========================================
// SISTEMA DE GRÁFICOS (Gerador de Sprites)
// ==========================================
function mk(rows, pal, s = 1) {
    const c = document.createElement("canvas");
    c.width = rows[0].length * s;
    c.height = rows.length * s;
    const g = c.getContext("2d");
    
    rows.forEach((r, y) => {
        [...r].forEach((ch, x) => {
            if (pal[ch]) {
                g.fillStyle = pal[ch];
                g.fillRect(x * s, y * s, s, s);
            }
        });
    });
    return c;
}

// Assets base
const blobR = [
    "............", "....gggg....", "..gggggggg..", ".gghhgggggg.", 
    ".gwwgggwwgg.", ".gkwgggkwgg.", "gggggggggggg", "gggggggggggg", 
    "gddggggggddg", "dddddddddddd", ".dddddddddd.", "............"
];

// Dicionário de Sprites
const S = {
    p: mk(["...kkkkkk...", "..kssssssk..", ".kssssssssk.", ".kssksskssk.", ".ksscsscssk.", ".kssssssssk.", "..kssmmssk..", "..kksssskk..", ".kbbbbbbbbk.", ".kbbbbbbbbk.", "..kbbbbbbk..", "..kk....kk.."], { k: "#1b1226", s: "#f4cfa8", m: "#a33", c: "#6cf", b: "#4a7fd0" }),
    fly: mk(["........", "ww....ww", "wwkkkkww", ".kkrrkk.", ".kkkkkk.", "..kkkk..", "...kk...", "........"], { w: "#cfd8ff", k: "#2a2233", r: "#f33" }),
    blob: mk(blobR, { g: "#5fbf4a", d: "#2f7a2f", w: "#fff", k: "#111", h: "#a6e88f" }),
    boss: mk(blobR, { g: "#c0392b", d: "#6e1a16", w: "#fff", k: "#111", h: "#ff8a70" }, 3),
    charger: mk(["k..........k", "kk.rrrrrr.kk", ".krrrrrrrrk.", ".krwwrrwwrk.", ".krwkrrkwrk.", ".krrrrrrrrk.", ".krwkwkwkrk.", "..krrrrrrk..", "...kkkkkk..."], { r: "#d9772b", k: "#2a1208", w: "#fff" }),
    ghost: mk(["...pppppp...", "..pppppppp..", ".pppppppppp.", ".ppwkppwkpp.", ".ppwwppwwpp.", ".pppppppppp.", ".ppppkkpppp.", ".pppppppppp.", ".pp.pppp.pp.", ".p..pppp..p."], { p: "#b9a7ff", w: "#fff", k: "#222" }),
    tear: mk([".bbb.", "bwbbb", "bbbbb", "bbbbb", ".bbb."], { b: "#6cc8ff", w: "#fff" }),
    shot: mk([".rrr.", "rwrrr", "rrrrr", "rrrrr", ".rrr."], { r: "#ff4b6e", w: "#fff" })
};

const hr = ["........", ".rr..rr.", "rrrrrrrr", "rwrrrrrr", "rrrrrrrr", ".rrrrrr.", "..rrrr..", "...rr..."];
const H2 = mk(hr, { r: "#e63946", w: "#ffb3b8" });
const H0 = mk(hr, { r: "#3a3042", w: "#3a3042" });
const H1 = mk(hr, { r: "#3a3042", w: "#3a3042" });

// Desenha coração pela metade
{
    const g = H1.getContext("2d");
    g.drawImage(H2, 0, 0, 4, 8, 0, 0, 4, 8);
}

// ==========================================
// ITENS DO JOGO
// ==========================================
const ITEMS = [
    { n: "Lágrima Pesada", d: "Dano +1,5", c: "#e55", f: () => G.dmg += 1.5 },
    { n: "Pílula de Cadência", d: "Atira mais rápido", c: "#fd4", f: () => G.delay *= .78 },
    { n: "Botas Aladas", d: "Velocidade +", c: "#4cf", f: () => G.spd += .2 },
    { n: "Coração Dourado", d: "Vida máxima +2", c: "#f7a", f: () => { G.max += 2; G.hp += 2 } },
    { n: "Tiro Triplo", d: "Três lágrimas por disparo", c: "#8f8", f: () => G.multi = 3 },
    { n: "Lágrima Perfurante", d: "Atravessa inimigos", c: "#c8f", f: () => G.pierce = true },
    { n: "Olho Longo", d: "Alcance +", c: "#fff", f: () => G.range += 60 }
];

const ISP = [
    mk(["....kk....", "...krrk...", "..krwrrk..", "..krrrrk..", ".krrrrrrk.", ".krrrrrrk.", ".krrrrrrk.", "..krrrrk..", "...kkkk...", ".........."], { k: "#2a0f14", r: "#e63946", w: "#ffb3b8" }),
    mk(["....kkkk..", "...kyyyk..", "..kyyyk...", ".kyyyk....", ".kyyyyyyk.", ".kkkyyyk..", "...kyyk...", "..kyyk....", "..kyk.....", "...k......"], { k: "#3a2a00", y: "#ffd23f" }),
    mk(["..kkkk....", ".kbbbbkw..", ".kbwbbkww.", ".kbbbbkwww", ".kbbbbkkk.", ".kbbbbbbbk", ".kbbbbbbbk", ".kkkkkkkkk", "..........", ".........."], { k: "#0b2a40", b: "#4cc9f0", w: "#fff" }),
    mk(["..........", ".kkk..kkk.", "kyyyykyyyk", "kywyyyyyyk", "kyyyyyyyyk", ".kyyyyyyk.", "..kyyyyk..", "...kyyk...", "....kk....", ".........."], { k: "#4a3200", y: "#ffc83d", w: "#fff" }),
    mk(["....kk....", "...kggk...", "..kgwggk..", "..kggggk..", "...kkkk...", ".kk.kk.kk.", "kggkggkggk", "kgwkgwkgwk", ".kk.kk.kk.", ".........."], { k: "#0e3318", g: "#6bd66b", w: "#fff" }),
    mk([".....k....", "....kpk...", "...kpwpk..", "..kpppppk.", "...kpppk..", "....kpk...", "....kpk...", "....kpk...", "....kpk...", ".....k...."], { k: "#2a1040", p: "#b983ff", w: "#fff" }),
    mk(["..........", "..kkkkkk..", ".kwwwwwwk.", "kwwwbbwwwk", "kwwbkkbwwk", "kwwbkkbwwk", ".kwwbbwwk.", "..kkkkkk..", "..........", ".........."], { k: "#222233", w: "#fff", b: "#4a90e2" })
];

// Atribuir sprites aos itens
ITEMS.forEach((it, i) => it.s = ISP[i]);

// Drops (moeda, bomba, chave)
S.coin = mk(["..kkk..", ".kyyyk.", "kyywyyk", "kyywyyk", "kyyyyyk", ".kyyyk.", "..kkk.."], { k: "#5a3d00", y: "#ffd23f", w: "#fff6b0" });
S.bomb = mk(["......yy.", ".....kk..", "..kkkkk..", ".kddddddk", "kddwddddk", "kddwddddk", "kdddddddk", ".kdddddk.", "..kkkkk.."], { k: "#000", d: "#3a3a48", w: "#8a8aa0", y: "#ffb703" });
S.key = mk([".kkkk.", "kyyyyk", "ky..yk", "kyyyyk", ".kyyk.", ".kyyk.", ".kyykk", ".kyyyk", ".kyykk", ".kkk.."], { k: "#4a3200", y: "#ffd23f" });

// Cores de Portas e Paletas de Andares
const DC = { n: "#6b4a2c", item: "#ffc83d", shop: "#3ddc97", boss: "#e63946" };
const FL = [
    ["#3a2d3e", "#43364a", "#241a2e"], 
    ["#2b3a3a", "#314545", "#17262a"], 
    ["#443029", "#4d382f", "#2a1a17"]
];

// ==========================================
// VARIÁVEIS DE ESTADO DO JOGO
// ==========================================
const keys = {}, mouse = { x: 0, y: 0, d: 0 };
let G = { state: "title", floor: 1, t: 0 }, p, AC, shake = 0, flash = 0;

// ==========================================
// SISTEMA DE ÁUDIO
// ==========================================
function ac() {
    if (!AC) try { AC = new AudioContext() } catch (e) { }
}

function snd(f, d = .08, t = "square", v = .035) {
    if (!AC) return;
    const o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime;
    o.type = t;
    o.frequency.setValueAtTime(f, n);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f * .5), n + d);
    g.gain.setValueAtTime(v, n);
    g.gain.exponentialRampToValueAtTime(.0001, n + d);
    o.connect(g);
    g.connect(AC.destination);
    o.start();
    o.stop(n + d);
}

// ==========================================
// INPUTS E EVENTOS
// ==========================================
let la = "";
const AD = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

function aim() {
    const k = keys[la] ? la : Object.keys(AD).find(a => keys[a]);
    return k ? AD[k] : null;
}

addEventListener("blur", () => {
    for (const k in keys) keys[k] = 0;
    la = "";
});

addEventListener("keydown", e => {
    keys[e.code] = 1;
    if (AD[e.code]) la = e.code;
    if (e.code.startsWith("Arrow") || e.code == "Space") e.preventDefault();
    
    ac(); // Inicia contexto de áudio
    
    if (G.state == "title") {
        newGame();
    } else if (G.state == "over" && (e.code == "Enter" || e.code == "Space" || e.code == "KeyR")) {
        newGame();
    } else if (G.state == "play" && (e.code == "Space" || e.code == "KeyE") && !e.repeat) {
        bomb();
    } else if (e.code == "KeyP" || e.code == "Escape") {
        G.state = G.state == "play" ? "pause" : G.state == "pause" ? "play" : G.state;
    }
});

addEventListener("keyup", e => keys[e.code] = 0);

function mpos(e) {
    const r = C.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width * W;
    mouse.y = (e.clientY - r.top) / r.height * CV - OY;
}

C.addEventListener("pointerdown", e => {
    window.focus();
    ac();
    mpos(e);
    mouse.d = 1;
    if (G.state == "title") newGame();
});

C.addEventListener("pointermove", mpos);
addEventListener("pointerup", () => mouse.d = 0);

// ==========================================
// LÓGICA PRINCIPAL DO JOGO
// ==========================================
function newGame() {
    G = {
        state: "play", floor: 1, hp: 6, max: 6, dmg: 3.5, delay: .38, spd: 1, range: 150, 
        multi: 1, pierce: false, kills: 0, t: 0, taken: {}, bn: null, 
        tr: [], sh: [], pt: [], bb: [], ex: [], coins: 0, bombs: 1, keys: 0, hint: 0
    };
    p = { x: 208, y: 128, vx: 0, vy: 0, cd: 0, inv: 0 };
    genFloor();
}

// Geração Procedural do Andar (Masmorra)
function genFloor() {
    const n = Math.min(5 + G.floor * 2, 11), M = {}, K = (x, y) => x + "," + y, D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const s = { x: 3, y: 3, type: "start", clear: 1, vis: 1 };
    
    M[K(3, 3)] = s;
    const L = [s];
    let tr = 0;
    
    while (L.length < n && tr++ < 900) {
        const b = L[RI(0, L.length - 1)];
        const d = D4[RI(0, 3)];
        const x = b.x + d[0], y = b.y + d[1];
        
        if (x < 0 || y < 0 || x > 6 || y > 6 || M[K(x, y)]) continue;
        
        let nb = 0;
        D4.forEach(e => { if (M[K(x + e[0], y + e[1])]) nb++ });
        if (nb > 1) continue;
        
        const r = { x, y, type: "mob", clear: 0, vis: 0 };
        M[K(x, y)] = r;
        L.push(r);
    }
    
    // Conecta as salas criadas
    L.forEach(r => {
        r.u = M[K(r.x, r.y - 1)];
        r.d = M[K(r.x, r.y + 1)];
        r.l = M[K(r.x - 1, r.y)];
        r.r = M[K(r.x + 1, r.y)];
        r.n = !!r.u + !!r.d + !!r.l + !!r.r;
    });
    
    const ends = L.filter(r => r.n == 1 && r.type == "mob").sort((a, b) => (Math.abs(b.x - 3) + Math.abs(b.y - 3)) - (Math.abs(a.x - 3) + Math.abs(a.y - 3)));
    
    const boss = ends.shift() || L[L.length - 1];
    boss.type = "boss";
    
    const it = ends.pop() || L.find(r => r.type == "mob");
    if (it) { it.type = "item"; it.clear = 1; }
    
    const shp = ends.pop() || L.find(r => r.type == "mob");
    if (shp) { shp.type = "shop"; shp.clear = 1; }
    
    const mr = L.filter(r => r.type == "mob");
    if (G.floor > 1 && mr.length) mr[RI(0, mr.length - 1)].kr = 1;
    
    G.map = L;
    G.bn = { t: 3, s: "Andar " + G.floor };
    enter(s, null);
}

// Seleciona um item que ainda não foi pego
function pickItem() {
    const a = ITEMS.map((_, i) => i).filter(i => !G.taken[i]);
    const i = a.length ? a[RI(0, a.length - 1)] : RI(0, ITEMS.length - 1);
    return i;
}

// Constrói o layout interno da sala (paredes, pedras, itens)
function buildRoom(r) {
    r.g = Array.from({ length: CH }, (_, y) => Array.from({ length: CW }, (_, x) => x == 0 || y == 0 || x == CW - 1 || y == CH - 1 ? 1 : 0));
    r.pk = [];
    
    if (r.type == "mob") {
        let k = RI(3, 9);
        while (k--) {
            const x = RI(2, 23), y = RI(2, 13);
            if ((x >= 10 && x <= 15 && (y < 4 || y > 11)) || (y >= 6 && y <= 9 && (x < 4 || x > 21)) || (Math.abs(x - 13) < 3 && Math.abs(y - 8) < 3)) continue;
            r.g[y][x] = 1;
        }
    }
    if (r.type == "item") r.pk.push({ t: "item", x: 208, y: 128, i: pickItem() });
    if (r.type == "shop") r.pk.push(
        { t: "shop", k: "heart", x: 130, y: 128, price: 3 },
        { t: "shop", k: "bomb", x: 182, y: 128, price: 5 },
        { t: "shop", k: "key", x: 234, y: 128, price: 5 },
        { t: "shop", k: "item", x: 286, y: 128, price: 12, i: pickItem() }
    );
}

// Verificações do Grid e Colisões
function doorDir(c, tx, ty) {
    return c.u && ty == 0 && tx >= 12 && tx <= 13 ? "u" : c.d && ty == CH - 1 && tx >= 12 && tx <= 13 ? "d" : c.l && tx == 0 && ty >= 7 && ty <= 8 ? "l" : c.r && tx == CW - 1 && ty >= 7 && ty <= 8 ? "r" : null;
}

function lockedDoor(c, d) {
    const n = c[d], ir = c.type == "item" ? c : n.type == "item" ? n : null;
    return !!ir && G.floor > 1 && !ir.unlocked && ir.n == 1;
}

function dstyle(c, d) {
    const n = c[d], T = ["item", "shop", "boss"];
    return T.includes(c.type) ? c.type : T.includes(n.type) ? n.type : "n";
}

function isDoor(c, tx, ty) {
    return !!doorDir(c, tx, ty);
}

function solid(px, py) {
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS), c = G.cur;
    if (tx < 0 || ty < 0 || tx >= CW || ty >= CH) return true;
    if (!c.g[ty][tx]) return false;
    const d = doorDir(c, tx, ty);
    return !(d && c.clear && !lockedDoor(c, d));
}

function hit(x, y, r) {
    return solid(x - r, y - r) || solid(x + r, y - r) || solid(x - r, y + r) || solid(x + r, y + r);
}

function mv(o, dx, dy, r) {
    let b = 0;
    o.x += dx;
    if (hit(o.x, o.y, r)) { o.x -= dx; b = 1; }
    o.y += dy;
    if (hit(o.x, o.y, r)) { o.y -= dy; b = 1; }
    return b;
}

// Transição de Sala
function enter(r, dir) {
    G.cur = r;
    r.vis = 1;
    G.tr = []; G.sh = []; G.bb = []; G.ex = [];
    
    if (!r.g) buildRoom(r);
    
    if (dir == "u") { p.x = 208; p.y = RH - 26; }
    else if (dir == "d") { p.x = 208; p.y = 26; }
    else if (dir == "l") { p.x = W - 26; p.y = 128; }
    else if (dir == "r") { p.x = 26; p.y = 128; }
    else { p.x = 208; p.y = 128; }
    
    p.vx = p.vy = 0;
    p.inv = Math.max(p.inv, .5);
    
    if ((r.type == "mob" || r.type == "boss") && !r.clear && !r.en) spawn(r);
    r.en = r.en || [];
}

// Gerar Inimigos
function spawn(r) {
    const f = G.floor, hs = 1 + .28 * (f - 1), en = [];
    r.en = en;
    const mkE = (t, x, y, hp, rad, v) => ({ t, x, y, hp: hp * hs, max: hp * hs, r: rad, v, cd: R(.5, 1.5), st: 0, vx: 0, vy: 0, fl: 0, wake: .8, fly: t == "fly" || t == "ghost", n: 0 });
    
    if (r.type == "boss") {
        const b = mkE("boss", 208, 90, 95, 17, 26);
        b.cd = 1.5;
        en.push(b);
        return;
    }
    
    const pool = f > 1 ? ["fly", "blob", "charger", "ghost", "fly"] : ["fly", "blob", "charger", "fly"];
    const T = { fly: [3, 6, 42], blob: [8, 8, 0], charger: [6, 7, 0], ghost: [5, 7, 30] };
    let n = Math.min(RI(3, 4) + f, 8);
    
    while (n--) {
        const t = pool[RI(0, pool.length - 1)];
        let x, y, k = 0;
        do {
            x = R(36, W - 36);
            y = R(36, RH - 36);
            k++;
        } while ((hit(x, y, 9) || Math.hypot(x - p.x, y - p.y) < 100) && k < 60);
        en.push(mkE(t, x, y, ...T[t]));
    }
}

// Partículas, Dano, Combate
function burst(x, y, c, n = 8, s = 70) {
    for (let i = 0; i < n; i++) {
        const a = R(0, 6.28), v = R(.3, 1) * s;
        G.pt.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: R(.25, .6), c });
    }
}

function hurt(n) {
    if (p.inv > 0 || G.state != "play") return;
    G.hp -= n;
    p.inv = 1.2;
    shake = 6;
    flash = .25;
    snd(110, .25, "sawtooth", .06);
    burst(p.x, p.y, "#e63946", 10);
    if (G.hp <= 0) {
        G.hp = 0;
        G.state = "over";
        snd(70, .8, "sawtooth", .07);
    }
}

function fireE(e, a, v = 80) {
    G.sh.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 4 });
}

function drop(x, y, rate, c) {
    if (Math.random() < rate) {
        const q = Math.random();
        c.pk.push({ t: q < .55 ? "coin" : q < .75 ? "heart" : q < .88 ? "bomb" : "key", x, y });
    }
}

function bomb() {
    if (G.bombs <= 0) return;
    G.bombs--;
    G.bb.push({ x: p.x, y: p.y, t: 1.4 });
    snd(200, .1);
}

function boom(b) {
    const c = G.cur;
    shake = 12;
    snd(60, .5, "sawtooth", .08);
    G.ex.push({ x: b.x, y: b.y, t: .3 });
    burst(b.x, b.y, "#ffb703", 24, 120);
    burst(b.x, b.y, "#ff5a36", 16, 90);
    
    for (const e of c.en) {
        if (Math.hypot(e.x - b.x, e.y - b.y) < 44 + e.r * .5) {
            e.hp -= e.t == "boss" ? 18 : 30;
            e.fl = .15;
        }
    }
    if (Math.hypot(p.x - b.x, p.y - b.y) < 36) hurt(2);
    
    // Destrói pedras com explosão
    for (let ty = Math.floor((b.y - 42) / TS); ty <= Math.floor((b.y + 42) / TS); ty++) {
        for (let tx = Math.floor((b.x - 42) / TS); tx <= Math.floor((b.x + 42) / TS); tx++) {
            if (tx > 0 && ty > 0 && tx < CW - 1 && ty < CH - 1 && c.g[ty][tx] && Math.hypot(tx * TS + 8 - b.x, ty * TS + 8 - b.y) < 44) {
                c.g[ty][tx] = 0;
                burst(tx * TS + 8, ty * TS + 8, "#8a869e", 6, 60);
            }
        }
    }
}

function buy(k) {
    const m = t => {
        if (G.hint <= 0) { G.bn = { t: 1.5, s: t }; G.hint = 1.5; }
    };
    if (G.coins < k.price) return m("Moedas insuficientes");
    
    if (k.k == "heart") {
        if (G.hp >= G.max) return m("Vida cheia");
        G.hp = Math.min(G.max, G.hp + 2);
    } else if (k.k == "bomb") {
        G.bombs++;
    } else if (k.k == "key") {
        G.keys++;
    } else {
        const it = ITEMS[k.i];
        it.f();
        G.taken[k.i] = 1;
        G.bn = { t: 3, s: it.n + " — " + it.d };
    }
    G.coins -= k.price;
    k.dead = 1;
    snd(800, .2, "triangle", .05);
}

function unlock(c) {
    if (!c.clear) return;
    for (const d of ["u", "d", "l", "r"]) {
        if (!c[d] || !lockedDoor(c, d)) continue;
        
        const near = d == "u" ? p.y < 24 && Math.abs(p.x - 208) < 20 : d == "d" ? p.y > RH - 24 && Math.abs(p.x - 208) < 20 : d == "l" ? p.x < 24 && Math.abs(p.y - 128) < 20 : p.x > W - 24 && Math.abs(p.y - 128) < 20;
        
        if (!near) continue;
        
        if (G.keys > 0) {
            G.keys--;
            (c.type == "item" ? c : c[d]).unlocked = 1;
            snd(600, .2, "triangle", .05);
            G.bn = { t: 1.5, s: "Porta destrancada" };
        } else if (G.hint <= 0) {
            G.bn = { t: 1.5, s: "Precisa de uma chave" };
            G.hint = 1.5;
        }
    }
}

// ==========================================
// UI E MINI-MAPA
// ==========================================
function drawMap(c) {
    const seen = G.map.filter(r => r.vis || [r.u, r.d, r.l, r.r].some(n => n && n.vis));
    const xs = seen.map(r => r.x), ys = seen.map(r => r.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    
    const pw = 8, ph = 6;
    const mw = (Math.max(...xs) - x0) * pw + 7, mh = (Math.max(...ys) - y0) * ph + 5;
    const mx = W - mw - 7, my = OY + 6;
    
    X.fillStyle = "rgba(8,5,14,.72)";
    X.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
    
    X.fillStyle = "#4a3d63";
    X.fillRect(mx - 3, my - 3, mw + 6, 1);
    X.fillRect(mx - 3, my + mh + 2, mw + 6, 1);
    X.fillRect(mx - 3, my - 3, 1, mh + 6);
    X.fillRect(mx + mw + 2, my - 3, 1, mh + 6);
    
    for (const r of seen) {
        const cx = mx + (r.x - x0) * pw, cy = my + (r.y - y0) * ph;
        X.fillStyle = "#6b5d8c";
        if (r.r && seen.includes(r.r)) X.fillRect(cx + 7, cy + 2, 1, 1);
        if (r.d && seen.includes(r.d)) X.fillRect(cx + 3, cy + 5, 1, 1);
        
        const col = !r.vis ? "#3b3254" : r.type == "boss" ? "#b02a2e" : r.type == "item" ? "#d9a81c" : r.type == "shop" ? "#1fa971" : r.clear ? "#7a6c99" : "#b9acd6";
        X.fillStyle = r === c ? (Math.floor(G.t * 3) % 2 ? "#fff" : "#ffe08a") : col;
        X.fillRect(cx, cy, 7, 5);
        
        if (r.type != "mob") {
            X.fillStyle = r === c ? "#000" : "rgba(0,0,0,.65)";
            if (r.type == "boss") {
                X.fillRect(cx + 2, cy + 2, 1, 1);
                X.fillRect(cx + 4, cy + 2, 1, 1);
                X.fillRect(cx + 3, cy + 3, 1, 1);
            } else if (r.type == "item") {
                X.fillRect(cx + 3, cy + 1, 1, 3);
                X.fillRect(cx + 2, cy + 2, 3, 1);
            } else if (r.type == "shop") {
                X.fillRect(cx + 2, cy + 1, 3, 1);
                X.fillRect(cx + 3, cy + 2, 1, 1);
                X.fillRect(cx + 2, cy + 3, 3, 1);
            } else {
                X.fillRect(cx + 3, cy + 2, 1, 1);
            }
        }
    }
}

function go(d) {
    const nr = G.cur[d];
    if (nr) enter(nr, d);
}

// ==========================================
// UPDATE TICK (Física e IA)
// ==========================================
function update(dt) {
    G.t += dt;
    const c = G.cur;
    const mvx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const mvy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
    const m = Math.hypot(mvx, mvy) || 1;
    const sp = 95 * G.spd;
    const k = Math.min(1, dt * 12);
    
    p.vx += (mvx / m * sp - p.vx) * k;
    p.vy += (mvy / m * sp - p.vy) * k;
    mv(p, p.vx * dt, p.vy * dt, 5);
    
    p.inv -= dt; p.cd -= dt; G.hint -= dt;
    unlock(c);
    
    // Transição de porta
    if (c.clear) {
        if (c.u && p.y < 8 && Math.abs(p.x - 208) < 18) go("u");
        else if (c.d && p.y > RH - 8 && Math.abs(p.x - 208) < 18) go("d");
        else if (c.l && p.x < 8 && Math.abs(p.y - 128) < 18) go("l");
        else if (c.r && p.x > W - 8 && Math.abs(p.y - 128) < 18) go("r");
    }
    
    const aimd = aim();
    if (aimd && p.cd <= 0) {
        const a0 = Math.atan2(aimd[1], aimd[0]), n = G.multi;
        p.cd = G.delay;
        snd(520, .07, "square", .025);
        for (let i = 0; i < n; i++) {
            const a = a0 + (n > 1 ? (i - 1) * .2 : 0), v = 190;
            G.tr.push({ x: p.x, y: p.y, vx: Math.cos(a) * v + p.vx * .4, vy: Math.sin(a) * v + p.vy * .4, l: G.range / v, h: new Set() });
        }
    }
    
    // Projéteis do jogador
    for (const t of G.tr) {
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.l -= dt;
        if (t.l <= 0 || solid(t.x, t.y)) {
            t.dead = 1;
            burst(t.x, t.y, "#6cc8ff", 4, 40);
        }
    }
    
    // Bombas e Explosões
    for (const b of G.bb) {
        b.t -= dt;
        if (b.t <= 0) { b.dead = 1; boom(b); }
    }
    G.bb = G.bb.filter(b => !b.dead);
    
    for (const x of G.ex) x.t -= dt;
    G.ex = G.ex.filter(x => x.t > 0);
    
    // Projéteis dos Inimigos
    for (const s of G.sh) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.l -= dt;
        if (s.l <= 0 || solid(s.x, s.y)) {
            s.dead = 1;
            burst(s.x, s.y, "#ff4b6e", 3, 30);
        } else if (Math.hypot(s.x - p.x, s.y - p.y) < 8) {
            s.dead = 1;
            hurt(1);
        }
    }
    
    // IA dos Inimigos
    for (const e of c.en) {
        if (e.wake > 0) { e.wake -= dt; continue; }
        e.fl = Math.max(0, e.fl - dt);
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, f = G.floor;
        
        if (e.t == "fly") {
            e.n += dt;
            const a = Math.atan2(dy, dx) + Math.sin(e.n * 3) * .9;
            e.vx = Math.cos(a) * e.v;
            e.vy = Math.sin(a) * e.v;
        } else if (e.t == "blob") {
            e.cd -= dt;
            if (e.cd < 0) {
                e.cd = R(.8, 1.5);
                const a = Math.atan2(dy, dx) + R(-.5, .5);
                e.vx = Math.cos(a) * 105;
                e.vy = Math.sin(a) * 105;
            }
            e.vx *= Math.pow(.03, dt);
            e.vy *= Math.pow(.03, dt);
        } else if (e.t == "charger") {
            if (e.st == 0) {
                e.vx = dx / d * 22;
                e.vy = dy / d * 22;
                if (Math.abs(dx) < 12 || Math.abs(dy) < 12) {
                    e.st = 1;
                    const h = Math.abs(dx) < 12 ? [0, Math.sign(dy)] : [Math.sign(dx), 0];
                    e.vx = h[0] * 180;
                    e.vy = h[1] * 180;
                }
            } else if (e.st == 1) {
                if (e.bl) { e.st = 2; e.cd = 1; e.vx = e.vy = 0; shake = 3; }
            } else {
                e.cd -= dt;
                if (e.cd <= 0) e.st = 0;
            }
        } else if (e.t == "ghost") {
            const s = d < 110 ? -1 : d > 150 ? 1 : 0;
            e.vx = dx / d * e.v * s;
            e.vy = dy / d * e.v * s;
            e.cd -= dt;
            if (e.cd < 0) {
                e.cd = 1.8;
                const a = Math.atan2(dy, dx);
                fireE(e, a);
                if (f >= 3) { fireE(e, a + .35); fireE(e, a - .35); }
                snd(300, .1, "triangle");
            }
        } else if (e.t == "boss") {
            e.vx = dx / d * e.v;
            e.vy = dy / d * e.v;
            e.cd -= dt;
            if (e.dash > 0) {
                e.dash -= dt;
                e.vx = e.dx * 150;
                e.vy = e.dy * 150;
            }
            if (e.cd < 0) {
                e.n++;
                e.cd = 1.5;
                if (e.n % 3 == 0) {
                    e.dash = .5;
                    e.dx = dx / d;
                    e.dy = dy / d;
                } else if (e.n % 3 == 1) {
                    const k = 10 + f * 2, o = R(0, 6);
                    for (let i = 0; i < k; i++) fireE(e, o + i * 6.283 / k, 70);
                } else {
                    const a = Math.atan2(dy, dx);
                    for (let i = -2; i <= 2; i++) fireE(e, a + i * .22, 95);
                }
                snd(160, .2, "sawtooth");
            }
        }
        
        if (e.fly) {
            e.x = cl(e.x + e.vx * dt, 22, W - 22);
            e.y = cl(e.y + e.vy * dt, 22, RH - 22);
            e.bl = 0;
        } else {
            e.bl = mv(e, e.vx * dt, e.vy * dt, e.r * .7);
        }
        if (d < e.r * .8 + 5) hurt(e.t == "boss" ? 2 : 1);
    }
    
    // Colisões de Lágrimas vs Inimigos
    for (const t of G.tr) {
        for (const e of c.en) {
            if (t.dead || e.wake > 0 || t.h.has(e)) continue;
            if (Math.hypot(t.x - e.x, t.y - e.y) < e.r + 3) {
                e.hp -= G.dmg;
                e.fl = .1;
                t.h.add(e);
                burst(t.x, t.y, "#fff", 3, 50);
                snd(220, .05, "square", .03);
                const d = Math.hypot(t.vx, t.vy);
                if (e.t != "boss") {
                    e.x += t.vx / d * 3;
                    e.y += t.vy / d * 3;
                }
                if (!G.pierce) t.dead = 1;
            }
        }
    }
    
    // Morte dos Inimigos
    for (const e of c.en) {
        if (e.hp <= 0) {
            e.dead = 1;
            G.kills++;
            burst(e.x, e.y, e.t == "boss" ? "#c0392b" : "#9fe", e.t == "boss" ? 40 : 12, e.t == "boss" ? 140 : 80);
            snd(90, .3, "sawtooth", .05);
            shake = e.t == "boss" ? 14 : 2;
            if (e.t == "boss") {
                c.pk.push({ t: "trap", x: 256, y: 128 }, { t: "item", x: 160, y: 128, i: pickItem() });
            } else {
                drop(e.x, e.y, .22, c);
            }
        }
    }
    
    c.en = c.en.filter(e => !e.dead);
    G.tr = G.tr.filter(t => !t.dead);
    G.sh = G.sh.filter(s => !s.dead);
    
    // Sala Limpa (Portas abrem)
    if (!c.clear && c.en.length == 0 && c.en.length == 0 && c.spawned !== 0) {
        c.clear = 1;
        G.sh = [];
        snd(660, .2, "triangle");
        if (c.type != "boss") drop(208, 128, .5, c);
        if (c.kr) c.pk.push({ t: "key", x: 208, y: 150 });
        if (c.type == "boss") G.bn = { t: 3, s: "Chefe derrotado!" };
    }
    
    // Coletáveis / Interações (itens, moedas, corações)
    for (const k of c.pk) {
        if (Math.hypot(k.x - p.x, k.y - p.y) < 12) {
            if (k.t == "coin") { G.coins = Math.min(99, G.coins + 1); k.dead = 1; snd(990, .1, "triangle"); }
            else if (k.t == "bomb") { G.bombs++; k.dead = 1; snd(300, .12, "triangle"); }
            else if (k.t == "key") { G.keys++; k.dead = 1; snd(760, .15, "triangle"); }
            else if (k.t == "shop") { buy(k); }
            else if (k.t == "heart" && G.hp < G.max) { G.hp = Math.min(G.max, G.hp + 2); k.dead = 1; snd(880, .15, "triangle"); }
            else if (k.t == "item") { const it = ITEMS[k.i]; it.f(); G.taken[k.i] = 1; k.dead = 1; G.bn = { t: 3, s: it.n + " — " + it.d }; snd(700, .4, "triangle", .05); }
            else if (k.t == "trap") { G.floor++; G.hp = Math.min(G.max, G.hp + 2); genFloor(); return; }
        }
    }
    c.pk = c.pk.filter(k => !k.dead);
    
    // Atualiza Partículas
    for (const q of G.pt) {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vx *= .95;
        q.vy *= .95;
        q.l -= dt;
    }
    G.pt = G.pt.filter(q => q.l > 0);
    
    // Banners temporários
    if (G.bn) {
        G.bn.t -= dt;
        if (G.bn.t <= 0) G.bn = null;
    }
    shake *= .88;
    flash = Math.max(0, flash - dt);
}

// ==========================================
// RENDERIZAÇÃO 
// ==========================================
function shadow(x, y, w) {
    X.fillStyle = "rgba(0,0,0,.35)";
    X.beginPath();
    X.ellipse(x, y + OY, w, w * .4, 0, 0, 6.283);
    X.fill();
}

function spr(im, x, y, a = 1) {
    X.globalAlpha = a;
    X.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height / 2 + OY));
    X.globalAlpha = 1;
}

const vig = (() => {
    const g = X.createRadialGradient(W / 2, OY + RH / 2, 90, W / 2, OY + RH / 2, 270);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.6)");
    return g;
})();

function txt(s, x, y, sz = 8, col = "#fff", al = "left") {
    X.font = "bold " + sz + "px monospace";
    X.textAlign = al;
    X.fillStyle = "#000";
    X.fillText(s, x + 1, y + 1);
    X.fillStyle = col;
    X.fillText(s, x, y);
}

function draw() {
    X.fillStyle = "#0b0810";
    X.fillRect(0, 0, W, CV);
    
    if (!G.cur) {
        X.fillStyle = "rgba(0,0,0,.6)";
        X.fillRect(0, 0, W, CV);
        txt("CRIPTA DAS LÁGRIMAS", W / 2, 110, 24, "#e9a9ff", "center");
        txt("Desça pela masmorra. Não chore.", W / 2, 134, 9, "#fff", "center");
        txt("Pressione qualquer tecla ou toque para começar", W / 2, 170, 9, "#ffd166", "center");
        return;
    }
    
    const c = G.cur, pal = FL[(G.floor - 1) % 3];
    X.save();
    if (shake > .3) X.translate(R(-shake, shake) / 2 | 0, R(-shake, shake) / 2 | 0);
    
    // Desenha tiles do chão e paredes
    for (let y = 0; y < CH; y++) {
        for (let x = 0; x < CW; x++) {
            const px = x * TS, py = y * TS + OY, wall = x == 0 || y == 0 || x == CW - 1 || y == CH - 1;
            if (wall) {
                X.fillStyle = pal[2];
                X.fillRect(px, py, TS, TS);
                X.fillStyle = "rgba(255,255,255,.07)";
                X.fillRect(px, py, TS, 1);
                X.fillStyle = "rgba(0,0,0,.35)";
                X.fillRect(px, py + TS - 1, TS, 1);
                X.fillRect(px + (y % 2 ? 4 : 11), py, 1, TS);
                
                const dd = doorDir(c, x, y);
                if (dd) {
                    const lk = lockedDoor(c, dd);
                    X.fillStyle = DC[dstyle(c, dd)];
                    X.fillRect(px, py, TS, TS);
                    if (c.clear && !lk) {
                        X.fillStyle = "#050308";
                        X.fillRect(px + 3, py + 3, TS - 6, TS - 6);
                    } else {
                        X.fillStyle = "rgba(0,0,0,.5)";
                        for (let i = 3; i < TS; i += 5) X.fillRect(px + i, py + 1, 1, TS - 2);
                        if (lk) {
                            X.fillStyle = "#2a1a0e"; X.fillRect(px + 5, py + 5, 6, 6);
                            X.fillStyle = "#ffd23f"; X.fillRect(px + 6, py + 6, 4, 4);
                            X.fillStyle = "#000"; X.fillRect(px + 7, py + 7, 2, 3);
                        }
                    }
                }
            } else {
                X.fillStyle = (x * 7 + y * 13) % 5 == 0 ? pal[1] : pal[0];
                X.fillRect(px, py, TS, TS);
                X.fillStyle = "rgba(0,0,0,.12)";
                X.fillRect(px, py + TS - 1, TS, 1);
                X.fillRect(px + TS - 1, py, 1, TS);
                
                if (c.g[y][x]) {
                    X.fillStyle = "rgba(0,0,0,.4)"; X.fillRect(px + 1, py + TS - 3, TS - 1, 3);
                    X.fillStyle = "#5d5a70"; X.fillRect(px + 1, py + 2, TS - 3, TS - 5);
                    X.fillStyle = "#8a869e"; X.fillRect(px + 2, py + 3, TS - 7, 3);
                    X.fillStyle = "#46435a"; X.fillRect(px + 1, py + TS - 6, TS - 3, 3);
                }
            }
        }
    }
    
    if (c.type == "start" && G.floor == 1) {
        txt("WASD mover · SETAS atirar · ESPAÇO bomba", W / 2, OY + RH - 40, 8, "rgba(255,255,255,.35)", "center");
    }
    if (c.type == "shop") txt("LOJA", W / 2, OY + 44, 10, "#3ddc97", "center");
    
    const bob = Math.sin(G.t * 4) * 1.5;
    
    // Itens/Pickups
    for (const k of c.pk) {
        if (k.t == "heart") {
            shadow(k.x, k.y + 6, 5);
            spr(H2, k.x, k.y + bob);
        } else if (k.t == "trap") {
            X.fillStyle = "#5a4630"; X.fillRect(k.x - 10, k.y - 10 + OY, 20, 20);
            X.fillStyle = "#000"; X.fillRect(k.x - 8, k.y - 8 + OY, 16, 16);
            txt("▼", k.x, k.y + 4 + OY, 9, "#ffd166", "center");
        } else if (k.t == "coin") {
            shadow(k.x, k.y + 4, 3); spr(S.coin, k.x, k.y + bob * .5);
        } else if (k.t == "bomb") {
            shadow(k.x, k.y + 5, 4); spr(S.bomb, k.x, k.y + bob * .5);
        } else if (k.t == "key") {
            shadow(k.x, k.y + 6, 3); spr(S.key, k.x, k.y + bob * .5);
        } else {
            const sh = k.t == "shop", ic = sh && k.k != "item" ? (k.k == "heart" ? H2 : S[k.k]) : ITEMS[k.i].s;
            const col = sh && k.k != "item" ? "#ffd23f" : ITEMS[k.i].c;
            const w = ic.width * 2, h = ic.height * 2;
            
            X.fillStyle = "rgba(0,0,0,.4)"; X.fillRect(k.x - 11, k.y + 11 + OY, 22, 4);
            X.fillStyle = "#5d5a70"; X.fillRect(k.x - 9, k.y + 8 + OY, 18, 5);
            X.fillStyle = "#8a869e"; X.fillRect(k.x - 9, k.y + 8 + OY, 18, 2);
            
            X.fillStyle = col;
            X.globalAlpha = .2 + .1 * Math.sin(G.t * 4);
            X.beginPath(); X.arc(k.x, k.y + OY - 2 + bob, 13, 0, 6.283); X.fill();
            X.globalAlpha = 1;
            
            X.drawImage(ic, Math.round(k.x - w / 2), Math.round(k.y + bob + OY - h / 2 - 4), w, h);
            if (sh) txt("$" + k.price, k.x, k.y + OY + 22, 7, "#ffd23f", "center");
        }
    }
    
    // Bombas Ativas
    for (const b of G.bb) {
        shadow(b.x, b.y + 4, 4);
        spr(S.bomb, b.x, b.y, Math.floor(b.t * 10) % 2 ? 1 : .6);
    }
    
    // Inimigos e Jogador (Sort por Y)
    const L = [];
    c.en.forEach(e => L.push(e));
    L.push(p);
    L.sort((a, b) => a.y - b.y);
    
    for (const e of L) {
        if (e === p) {
            if (p.inv > 0 && Math.floor(p.inv * 20) % 2) continue;
            shadow(p.x, p.y + 6, 5);
            const b = (Math.abs(p.vx) + Math.abs(p.vy)) > 20 ? Math.abs(Math.sin(G.t * 14)) * 1.5 : 0;
            spr(S.p, p.x, p.y - b);
        } else {
            const im = S[e.t];
            shadow(e.x, e.y + im.height / 2 - 2, im.width / 2.4);
            spr(im, e.x, e.y, e.wake > 0 ? .35 : e.fl > 0 ? .5 : 1);
        }
    }
    
    // Projéteis
    for (const t of G.tr) spr(S.tear, t.x, t.y - 4);
    for (const s of G.sh) spr(S.shot, s.x, s.y);
    
    // Explosões (Marcadores de zona)
    for (const x of G.ex) {
        X.fillStyle = "rgba(255,200,80," + x.t * 2 + ")";
        X.beginPath(); X.arc(x.x, x.y + OY, (.3 - x.t) / .3 * 44, 0, 6.283); X.fill();
    }
    
    // Partículas
    for (const q of G.pt) {
        X.fillStyle = q.c;
        X.globalAlpha = Math.min(1, q.l * 3);
        X.fillRect(Math.round(q.x), Math.round(q.y + OY), 2, 2);
        X.globalAlpha = 1;
    }
    
    // Efeitos de Tela
    X.fillStyle = vig;
    X.fillRect(0, OY, W, RH);
    
    if (flash > 0) {
        X.fillStyle = "rgba(230,57,70," + flash * 1.2 + ")";
        X.fillRect(0, OY, W, RH);
    }
    
    // Barra de vida do Boss
    const bs = c.en.find(e => e.t == "boss");
    if (bs) {
        X.fillStyle = "#000"; X.fillRect(120, OY + RH - 14, 176, 6);
        X.fillStyle = "#c0392b"; X.fillRect(121, OY + RH - 13, 174 * Math.max(0, bs.hp / bs.max), 4);
    }
    X.restore();
    
    // HUD Superior (Interface)
    X.fillStyle = "#0b0810"; X.fillRect(0, 0, W, OY);
    for (let i = 0; i < G.max / 2; i++) {
        const v = G.hp - i * 2;
        X.drawImage(v >= 2 ? H2 : v == 1 ? H1 : H0, 6 + i * 10, 3);
    }
    
    [[S.coin, G.coins], [S.bomb, G.bombs], [S.key, G.keys]].forEach(([im, n], i) => {
        X.drawImage(im, W - 104 + i * 36, 4);
        txt(String(n).padStart(2, "0"), W - 104 + i * 36 + im.width + 3, 13, 8, "#fff");
    });
    
    txt("DANO " + G.dmg.toFixed(1) + "  VEL " + G.spd.toFixed(1) + "  ANDAR " + G.floor, 6, OY - 2, 7, "#b9a7ff");
    
    // Renderiza Minimapa no HUD
    drawMap(c); 
    const mx = 0, my = 0; // Utilizado internamente por dead-code de mapa
    for (const r of []) { // Logica residual minimizada
        const seen = 0; if (!seen) continue;
        X.fillStyle = r === c ? "#fff" : r.vis ? (r.type == "boss" ? "#c0392b" : r.type == "item" ? "#ffd166" : "#7b6f96") : "#3a3150";
        if (!r.vis && r.type == "boss") X.fillStyle = "#6e1a16";
        X.globalAlpha = .85; X.fillRect(mx + r.x * 9, my + r.y * 7, 8, 6); X.globalAlpha = 1;
    }
    
    if (G.bn) txt(G.bn.s, W / 2, OY + 22, 10, "#ffd166", "center");
    
    // Telas de Pause e Game Over
    if (G.state != "play") {
        X.fillStyle = "rgba(0,0,0,.65)";
        X.fillRect(0, 0, W, CV);
        if (G.state == "pause") {
            txt("PAUSADO", W / 2, CV / 2, 18, "#fff", "center");
        } else {
            txt("VOCÊ MORREU", W / 2, 112, 22, "#ff6b81", "center");
            txt("Andar " + G.floor + "  ·  Abates " + G.kills, W / 2, 138, 10, "#fff", "center");
            txt("Enter ou R para tentar de novo", W / 2, 166, 9, "#ffd166", "center");
        }
    }
}

// ==========================================
// LOOP PRINCIPAL
// ==========================================
let last = performance.now();
function loop(n) {
    const dt = Math.min(.033, (n - last) / 1000); // Limita dt (max ~30fps lock para saltos longos)
    last = n;
    if (G.state == "play") update(dt);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);