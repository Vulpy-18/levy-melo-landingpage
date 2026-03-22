import { useState, useEffect, useRef } from "react";

const CRIMSON = "#c7251a";
const CRIMSON_DIM = "#8f1a12";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --crimson: #c7251a;
    --crimson-dim: #8f1a12;
    --black: #0A0A0A;
    --black-mid: #111111;
    --black-card: #141414;
    --black-border: #1E1E1E;
    --white: #F0ECE8;
    --muted: #5A5A5A;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--black);
    color: var(--white);
    font-family: 'Syne', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--black); }
  ::-webkit-scrollbar-thumb { background: var(--crimson); }

  .fade-in {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.85s cubic-bezier(.22,1,.36,1), transform 0.85s cubic-bezier(.22,1,.36,1);
  }
  .fade-in.visible {
    opacity: 1;
    transform: none;
  }

  @keyframes glitch {
    0%   { clip-path: inset(0 0 95% 0); transform: translate(-3px,0); }
    20%  { clip-path: inset(30% 0 50% 0); transform: translate(3px,0); }
    40%  { clip-path: inset(60% 0 20% 0); transform: translate(-2px,0); }
    60%  { clip-path: inset(80% 0 5% 0); transform: translate(2px,0); }
    80%  { clip-path: inset(10% 0 80% 0); transform: translate(-1px,0); }
    100% { clip-path: inset(0 0 0 0); transform: translate(0,0); }
  }

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; } 50% { opacity: 0; }
  }

  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(199,37,26,0.4); }
    70% { box-shadow: 0 0 0 14px rgba(199,37,26,0); }
    100% { box-shadow: 0 0 0 0 rgba(199,37,26,0); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes count-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes draw-line {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .cursor-dot {
    position: fixed;
    width: 8px; height: 8px;
    background: var(--crimson);
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    transition: transform 0.1s ease;
    mix-blend-mode: difference;
  }

  .cursor-ring {
    position: fixed;
    width: 36px; height: 36px;
    border: 1px solid rgba(199,37,26,0.5);
    border-radius: 50%;
    pointer-events: none;
    z-index: 99998;
    transition: transform 0.18s ease, width 0.2s, height 0.2s, border-color 0.2s;
  }

  .noise-overlay {
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 9000; opacity: 0.35;
  }
`;

// ── CURSOR ──────────────────────────────────────────────────────────────────
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX - 4 + "px";
        dotRef.current.style.top = e.clientY - 4 + "px";
      }
    };
    window.addEventListener("mousemove", move);
    let raf;
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x - 18 + "px";
        ringRef.current.style.top = ring.current.y - 18 + "px";
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

// ── USE SCROLL REVEAL ───────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".fade-in");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); } });
    }, { threshold: 0.12 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

// ── COUNTER ─────────────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const isSymbol = isNaN(parseInt(target));
        if (isSymbol) { setCount(target); return; }
        const end = parseInt(target);
        const dur = 1200;
        const step = Math.ceil(end / (dur / 16));
        let cur = 0;
        const timer = setInterval(() => {
          cur = Math.min(cur + step, end);
          setCount(cur);
          if (cur >= end) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── NAV ──────────────────────────────────────────────────────────────────────
function Nav({ scrolled }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "1.2rem 4rem",
      background: scrolled ? "rgba(10,10,10,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? "1px solid #1E1E1E" : "1px solid transparent",
      transition: "all 0.4s ease",
    }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.7rem", letterSpacing: "0.12em" }}>
        LEVY<span style={{ color: CRIMSON }}>.</span>MELO
      </div>
      <ul style={{ display: "flex", gap: "2.4rem", listStyle: "none" }}>
        {["Serviços", "Público", "Portfólio", "Sobre", "Contato"].map(item => (
          <li key={item}>
            <a href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace("ó","o")}`}
               style={{
                 fontFamily: "'DM Mono', monospace", fontSize: "0.68rem",
                 letterSpacing: "0.2em", textTransform: "uppercase",
                 color: "#5A5A5A", textDecoration: "none", transition: "color 0.2s"
               }}
               onMouseEnter={e => e.target.style.color = CRIMSON}
               onMouseLeave={e => e.target.style.color = "#5A5A5A"}>
              {item}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [typed, setTyped] = useState("");
  const fullText = "VOCÊ CUIDA DA SAÚDE.";
  const fullText2 = "EU CUIDO DAS VENDAS.";

  useEffect(() => {
    let i = 0; let phase = 0;
    const total = fullText.length + fullText2.length;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
      } else {
        setTyped(fullText + "\n" + fullText2.slice(0, i - fullText.length));
      }
      i++;
      if (i > total) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, []);

  const lines = typed.split("\n");

  return (
    <section id="hero" style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
      alignItems: "center", padding: "9rem 4rem 4rem", position: "relative", overflow: "hidden",
    }}>
      {/* BG text */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(7rem,17vw,20rem)",
        color: "rgba(199,37,26,0.04)", whiteSpace: "nowrap", pointerEvents: "none",
        userSelect: "none", letterSpacing: "-0.02em",
      }}>SISTEMAS</div>

      {/* Scanline */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", width: "100%", height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(199,37,26,0.15), transparent)",
          animation: "scanline 5s linear infinite",
        }} />
      </div>

      {/* Left */}
      <div>
        <p style={{
          fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.3em",
          textTransform: "uppercase", color: CRIMSON, marginBottom: "1.4rem",
          display: "flex", alignItems: "center", gap: "0.8rem", opacity: 0,
          animation: "count-up 0.7s 0.3s forwards",
        }}>
          <span style={{ display: "inline-block", width: "2rem", height: "1px", background: CRIMSON }} />
          Dev de Sistemas · Saúde &amp; Terapias
        </p>

        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(3.2rem, 6.5vw, 6.5rem)",
          lineHeight: 0.92, letterSpacing: "0.03em", marginBottom: "2rem",
          minHeight: "calc(2 * 1.1em * clamp(3.2rem, 6.5vw, 6.5rem) / 1rem)",
        }}>
          {lines.map((line, i) => (
            <div key={i}>
              {i === 1 ? <span style={{ color: CRIMSON }}>{line}</span> : line}
              {i === lines.length - 1 && (
                <span style={{ animation: "blink 1s infinite", color: CRIMSON }}>|</span>
              )}
            </div>
          ))}
        </h1>

        <p style={{
          fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(240,236,232,0.58)",
          maxWidth: "420px", marginBottom: "3rem",
          opacity: 0, animation: "count-up 0.8s 1.2s forwards",
        }}>
          Implemento a estrutura digital completa para profissionais da saúde e terapias que querem escalar seus resultados — sem equipe, sem complicação.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", opacity: 0, animation: "count-up 0.8s 1.5s forwards" }}>
          <a href="https://wa.me/5585984035152?text=Olá%20Levy%2C%20vim%20pelo%20seu%20site!" target="_blank"
            style={{
              background: CRIMSON, color: "#fff", padding: "0.9rem 2.2rem",
              fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.2em",
              textTransform: "uppercase", textDecoration: "none", display: "inline-block",
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              animation: "pulse-ring 2.5s ease infinite",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseEnter={e => { e.target.style.background = CRIMSON_DIM; e.target.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.target.style.background = CRIMSON; e.target.style.transform = "none"; }}>
            📲 WhatsApp
          </a>
          <a href="#servicos" style={{
            background: "transparent", color: "#F0ECE8", padding: "0.9rem 2.2rem",
            border: "1px solid #1E1E1E", fontFamily: "'DM Mono', monospace",
            fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
            textDecoration: "none", display: "inline-block", transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = CRIMSON; e.currentTarget.style.color = CRIMSON; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E1E"; e.currentTarget.style.color = "#F0ECE8"; }}>
            Ver serviços
          </a>
        </div>
      </div>

      {/* Right card */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{
          width: "340px", height: "420px",
          background: "#141414", border: "1px solid #1E1E1E", position: "relative",
          overflow: "hidden", animation: "float 5s ease-in-out infinite",
          clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
          opacity: 0, transition: "opacity 0.8s 1.8s",
        }} ref={el => { if (el) setTimeout(() => el.style.opacity = 1, 50); }}>

          {/* Corner accents */}
          {[["top:0;left:0;borderTop:2px solid "+CRIMSON+";borderLeft:2px solid "+CRIMSON, "tl"],
            ["bottom:0;right:0;borderBottom:2px solid "+CRIMSON+";borderRight:2px solid "+CRIMSON, "br"]].map(([s, k]) => (
            <div key={k} style={{
              position: "absolute", width: "55px", height: "55px", pointerEvents: "none",
              ...Object.fromEntries(s.split(";").map(p => { const [k,v]=p.split(":"); return [k,v]; }))
            }} />
          ))}

          <div style={{
            position: "absolute", top: "1.4rem", right: "1.4rem",
            background: CRIMSON, color: "#fff",
            fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
            letterSpacing: "0.2em", padding: "0.3rem 0.7rem", textTransform: "uppercase",
          }}>Disponível</div>

          {/* Photo placeholder */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.5rem",
            background: "linear-gradient(135deg, #141414, #0f0f0f)",
          }}>
            <div style={{ fontSize: "3rem", color: "#1E1E1E" }}>📸</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#5A5A5A", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              Sua foto aqui
            </div>
          </div>

          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem",
            background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)",
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "0.1em" }}>LEVY MELO</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: CRIMSON, letterSpacing: "0.25em", textTransform: "uppercase", marginTop: "0.3rem" }}>
              Dev · Designer · Estrategista
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { num: "5", suffix: "+", label: "Especialidades" },
    { num: "100", suffix: "%", label: "Foco em Saúde" },
    { num: "0", suffix: "", label: "Burocracia" },
    { num: "∞", suffix: "", label: "Escalabilidade" },
  ];
  return (
    <div style={{
      background: "#141414", borderTop: "1px solid #1E1E1E", borderBottom: "1px solid #1E1E1E",
      display: "flex", justifyContent: "space-around", padding: "2rem 4rem", flexWrap: "wrap", gap: "1.5rem",
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.8rem", color: CRIMSON, lineHeight: 1 }}>
            <Counter target={s.num} suffix={s.suffix} />
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.63rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5A5A5A", marginTop: "0.4rem" }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SERVICES ─────────────────────────────────────────────────────────────────
function Services() {
  const [hovered, setHovered] = useState(null);
  const services = [
    { num: "01", icon: "🎬", name: "Edição & Postagem de Vídeos", desc: "Edição profissional para Instagram com cortes, legendas, motion e estratégia de postagem para maximizar alcance e engajamento." },
    { num: "02", icon: "🎨", name: "Design de Carrosséis", desc: "Criação e postagem de carrosséis estratégicos — identidade visual coerente, copy persuasivo e arte que converte." },
    { num: "03", icon: "🚀", name: "Páginas de Vendas & Captura", desc: "Desenvolvimento de páginas de alta conversão para lançamentos — copy, design e tecnologia integrados." },
    { num: "04", icon: "⚙️", name: "Personalização Kiwify", desc: "Configuração completa: diagramação, checkout customizado, cadastro de aulas e materiais — pronto para vender." },
    { num: "05", icon: "🤖", name: "Automações ManyChat", desc: "Fluxos de automação via Instagram — respostas automáticas, funis de relacionamento e captura de leads." },
    { num: "++", icon: "🎯", name: "Tudo integrado, tudo estratégico", desc: "Cada serviço pode ser contratado individualmente ou combinado. Resultado: você vende enquanto atende." },
  ];
  return (
    <section id="servicos" style={{ padding: "6rem 4rem", background: "#111111" }}>
      <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "4rem" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.3em", color: CRIMSON, opacity: 0.7 }}>01</span>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "0.06em" }}>
          O QUE <span style={{ color: CRIMSON }}>ENTREGO</span>
        </h2>
        <div style={{ flex: 1, height: "1px", background: "#1E1E1E" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "#1E1E1E", border: "1px solid #1E1E1E" }}>
        {services.map((s, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="fade-in"
            style={{
              background: hovered === i ? "#161616" : "#141414",
              padding: "2.4rem 2rem", position: "relative", overflow: "hidden",
              transition: "background 0.25s",
            }}>
            <div style={{
              position: "absolute", top: 0, left: 0, width: "2px",
              height: hovered === i ? "100%" : "0%",
              background: CRIMSON, transition: "height 0.35s ease",
            }} />
            <div style={{
              position: "absolute", top: "1.4rem", right: "1.4rem",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem",
              color: "rgba(199,37,26,0.07)", lineHeight: 1, pointerEvents: "none",
            }}>{s.num}</div>
            <span style={{ fontSize: "1.6rem", marginBottom: "1.2rem", display: "block" }}>{s.icon}</span>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.8rem", lineHeight: 1.3 }}>{s.name}</div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", lineHeight: 1.7, color: "#5A5A5A" }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── AUDIENCE ─────────────────────────────────────────────────────────────────
function Audience() {
  const tags = ["Psicólogos","Nutricionistas","Terapeutas","Coaches de Saúde","Médicos","Fisioterapeutas","Enfermeiros","Acupunturistas","Fonoaudiólogos","Farmacêuticos","Yoga","Outros terapeutas"];
  const pains = [
    { icon: "✗", text: "Não sabe criar conteúdo digital que vende de verdade", bad: true },
    { icon: "✗", text: "Não tem habilidades técnicas de design, edição ou automação", bad: true },
    { icon: "✗", text: "Não tem paciência ou tempo para aprender ferramentas complexas", bad: true },
    { icon: "✗", text: "Não tem equipe para executar — e não quer montar uma", bad: true },
    { icon: "✓", text: "Você só quer vender e escalar — o resto é comigo.", bad: false },
  ];
  const [hoveredTag, setHoveredTag] = useState(null);

  return (
    <section id="publico" style={{ padding: "6rem 4rem", background: "#0A0A0A" }}>
      <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "4rem" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.3em", color: CRIMSON, opacity: 0.7 }}>02</span>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "0.06em" }}>
          FEITO PRA <span style={{ color: CRIMSON }}>VOCÊ</span>
        </h2>
        <div style={{ flex: 1, height: "1px", background: "#1E1E1E" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
        <div className="fade-in">
          <p style={{ fontSize: "1.15rem", lineHeight: 1.7, color: "rgba(240,236,232,0.82)", marginBottom: "2rem" }}>
            Se você é profissional da saúde ou terapias e sabe que precisa de presença digital para crescer — mas não tem tempo, habilidade ou equipe — esse trabalho foi feito pra você.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {tags.map((t, i) => (
              <span key={i} onMouseEnter={() => setHoveredTag(i)} onMouseLeave={() => setHoveredTag(null)}
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: "0.63rem", letterSpacing: "0.18em",
                  textTransform: "uppercase", border: `1px solid ${hoveredTag === i ? CRIMSON : "#1E1E1E"}`,
                  padding: "0.4rem 0.9rem", color: hoveredTag === i ? CRIMSON : "#5A5A5A",
                  transition: "all 0.2s", cursor: "default",
                }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="fade-in">
          {pains.map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: "1rem",
              background: "#141414",
              border: `1px solid ${p.bad ? "#1E1E1E" : CRIMSON}`,
              padding: "1.2rem 1.4rem", marginBottom: "0.7rem",
              transition: "border-color 0.3s",
              transform: `translateX(${i * 6}px)`,
            }}>
              <span style={{ color: p.bad ? CRIMSON : "#4ADE80", fontSize: "1rem", flexShrink: 0, marginTop: "0.1rem" }}>{p.icon}</span>
              <p style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", lineHeight: 1.6,
                color: p.bad ? "rgba(240,236,232,0.65)" : "rgba(240,236,232,0.9)",
                fontWeight: p.bad ? "normal" : "500",
              }}>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PORTFOLIO ─────────────────────────────────────────────────────────────────
const MANYCHAT_IMG = "/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAHgBAADASIAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAQFAgMGAQcI/8QASxAAAQMCBAIIAwUGBQMCAwkAAQACAwQRBQYSIRMxFCIyQVFSYXEHkaEjMzSBkhVCU2KCsRZUcsHRJGPhF/BDovEIJjU2N2Sjs9L/xAAaAQEBAQEBAQEAAAAAAAAAAAAAAQIEAwUG/8QAMxEBAAIBAgUBBgYCAgMBAAAAAAERAgMhBBITMVFBFBUiMlJhBXGBkaHB0fCx4SMz8UL/2gAMAwEAAhEDEQA/AP12iItMiIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIm5cGjmUC6XUqOJrByufFZqWtIV0upqJZSFdLqaiWUhXS6mollIV0upqJZSFdLqaiWUhXS6mollIV0upqJZSFdLqaiWUhXS6mollIV0upqJZSFdLqaiWUhXS6mrwgEWICWUhos549HWbyWCqCIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICLVVVENLA6eokbHG0blxsqnpOK4nvRNFDTHlNKy73+ob3D3R46mvjhPL3nxH+/wDK6cQASSB7qty1jVPiszmNHDnjvqjJv+YPeFpOX6WUaq2eqrHd/ElNvkLBYZQy9HhVW6okfxKhzSBbkxvortTnnPip1sKxiMd73/3f93Q4nW02HUE9dVyCOCBhe9x7gF8ZrMz/ABPzlK6syfQvw/Co3Oax149UhHiX9/o3YE7k93ffGKCoqMg1sdOHk6mFwZz06hdUOWqSdnw7y/GyKrdQsme6uipLtkk3da9tyNXMDnt3Lyx4nHT1OWYuavd+p4LR08eH68xE5Tly77xG19vWZ7Qo8Kzln7J9dTw57pePQzPsZhodJHf1jNu4mx3O9uS+t1mIsGAS4rRPjmZ0YzxOBu1w03B27l8tz7DJB8Lqk1Ec8UcmItbQisuagQ82glx1dziBzA2tsu0+Hc4pPhjh1TiRDYoqR0jy7rARi5H/AMttvyXtlnGc3VNfiHDafs0cRjERPNOM12na7r+JH5xfFTmWXDbDm13G2LQ5zXE7XG7fXmtX+OGwljamjY5z5ZG2hlLiA1xDTa3fbxUrCMyYDitJLLUUUlBBFGyUOr4GxsdG8nS5pO1ib7cx4KyfVZdfUxRPqcNNROLxt1s1v1DmO839FNvD4W/lTx501icihiIgaTI5tSHN/d0gEDe5eAsIc7PngFRBhRdFpJcTOAQQ3U7a3hdT6DEcsuxWowagFLPNwHVE4iDXtsCGkO9eW3ooMGdMpuyvQY/CW9Cr6htLA0QgPMjnFmnT+Rv6Jt4N/Lr2O1MDh3i69UA4xhDWVDjidGG0xtOeM20R5Wdvt+ayZi2FvmjhZiNI6WSPiMYJmkuZ5gL7j1WGk1FXjHMFNJ0sYtQ9H18Pi8dunV4Xvz9FsixXDJamKmixClfNKziRxtlaXPb4gX3CCYiIgIiICIiAiIgIiICIiDicxYlUv41XJNO2lhqTTRQ08ronOcObnOAJ9gt+WsQrY6ik4j5zSVkj4mxTvL3xuaL6g4gEtO45bFSKzAsSkxasqIXYcaWWRsjIp4jJ1w2xdbuPqOeysMPwuqNczEMVq21NRGCIWRs0xxX5kDmTbvK+rnqaMaXLt2/r/Pef/j5uGnqzq82/f+/8do/+rOp+4d7KK3kpVT9w/wBlFbyXy4fRl6iIqgiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgLCaRkMT5ZHBrGNLnE8gAs1S42TX4hBg7LmMji1Nj+4OTfzKPLX1enhcd+0fmwooH4xUDEa1hFK0/9NA4bEedw8T3BXoAHJeMaGtDWiwAsAvUNHSjTjfeZ7z5F7TfifyK8WVN+J/pKPZuq6eGqppKaoYHxSNLXtPeFwNdljMuDiRmWa9/Ae4kRl4FiRa/qALeu2y+houbW4fHVqZmYmPWHVw/F56F8tTE+k7w+UU+RM0ZkrKeTOOJPFHC7VwGy6nO+Wzb+PqeS+m1NJfC5KKk4cN4THFdmprNrC7e8eilIvTTw6eNRN/m3xXHavFVGVREdojaIfKZ/hrjNRC//AKqgomskhkjoqWSUU8j2aruIPYJ1cmiwsOak0nwxfFhssBnpGzvNIY5GtcTFwpXPcGk776iAvpqL0uXFUOByTkrEcFxjpdVJhnCiwwYfGaaNzXy2fqEjye/08VVU3wtq4oaendicDqanZBLFDoNm1LSwSSfm1m3q4r6miXJT5NSfCyupqerjNTRzusGwPfJKHPAl4mp1jZrh42O9/ZbYvhzj8c9PLHieHRytpeHLMISdTtD2gaCNO2vtDSdjcbr6oiXJUPitRkXMeAxdPipqfF55JXDozIuLGwOgEZcQ4t3u3a3iR6qzyT8NsSwyvwjEKyaD7FlPLKwyP1wyRwiMsbbYjbmfE7FfV0S5KgREUUREQEREBERAREQEREBERBrqfuH+yit5KVVfh3+yis5KwkvURFUEREBERAREQERLjxQES48UuPFARLjxS48UBEuPFLjxQES48UuPFARLjxS48UBEuPFLjxQES48UuPFARLjxS48UBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAJABJNgqbLQNSarFH31VMpDL9zG9Vv+5/NScxVBpsEqpW9rhkN9zsP7rfhVOKXDqenH/wAOMN+iObL49eI+mL/Wdo/tJRER0iypvxP9JWKypvxP9JRUtRamoLXaGbW5lSlWzfeu91IJl7x5fOU40vnK43E894XQT4jSzPhFZSVkdMynMoD5Q/R1gP6z8loxX4jYPDC92G3rJGOcHNIMYLQx51NJHWF2EXC1TNu540vnKcaXzlcfU56wtlJI+Bkss7G3DDG5rJCHND2teRZxbq3spGO5hxCmxSoocJwqOudR0zamqMlRwtLXarNbsbuOknew9ULdRxpfOU40vnK5Vuecv/saPFn1Erad9x904uBEesiwHlKl4lmnCsOippKs1MfHiMwb0d5dHGLXe8AdUC43KFr/AI0vnKcaXzlcn/j3LYbK91VMxkeoNc6neGylrwxwjNuuQ4gWHisY8/5clfGyGomeX2Gro79MbnOcwNebdU6mkWPelFuu40vnKcaXzlcfR5/wCSJpqJ5ISI9T38F5iDuGJC0PtYnTvbmtlZnTD2YFW4pTQVMnQaiKCeGWF8cjS8s/dIueq8HbmhbrONL5ynGl85XLNzvgBLBxqkEnTIDTP+wOvR9pt1Ottutk+csDiFJ9tPI6sYx8DI4HOc8P1adgP5XfJC3S8aXzlONL5yqDDM0Y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x6tzuPay+kZTpp6PK+F0lUwsnhpImSNJBIcGgEbeqCaKSlFMaUU0IgItwhGNHy5KM3BsLbXtrhQQcdsbYmO0CzWtJIsOQ3ceSnooNXR6e1uBFYWHYHcbj67raiICIiAiIgIiICIiAptD90fdQlNofuj7qSsNlV9w/wBlFZ2VKqvuH+yis7Kkdll6iIqgiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAvab8T/SV4vab8T/SUExVs33rvdWSrZvvXe6kEsERFpBERAO/NERAREQEREBERAREQEREBERAREQEREBTaH7o+6hKbQ/dH3UlYZ1X4d/sozOypNV+Hf7KMzsqQsvURFUEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQF7Tfif6SvF7Tfif6SgmKtm+9d7qyVbN9673Ugl87r864rR5tqaJ1NHLQw1wpdLaZ4dbgh9+LfRqLjYNt3hW1bnOJ2XK7GMKopKxtLwhYuDQ8vDTYH0Dhf1VjLljB5MVkxTox6W+QTajI4sEgbpD9F9OoADe3cscKythlDll+AvjM9NKXum1dUyOe7UTty35W5WC2jn4viHHRw1T8aw6ogayeeOGRmktl4cgZp57O6zdzYc/BWYzvhgy/FjUkFQynfLJC4EAlr2BxtsbG+mwI53CsJsr4FNTCnmoGvjBkcA5zibyG7je97kgG62HLuDuwlmFSUglpGStlDJHucS8O1BxJNybjvQc5UfEvBoqWKqFLUuhe4NJuwFuzCdibm2sA27wVe5ezJR43UPhpYZmvijD5dYH2btbm6D/NdpWmpyTlioY1kmFsDWve+zXuaCXuDnXsdwXAGx8FlgmV6XC8Rlr46iV889RLUTWAa2RzwALgeAG3uSgq8t5pxLFMerqc0jXUVJSmUOY0B8r+JI0AdbYWZb1Pgszn/AA6T8FQVtZ9jx3cMNGlg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YiWNfAi8gTgReQLYiWMGxRtNwwXWaLxxDRckAeqDXVm1O/2UZnZXlROJ3COPdgNyfFet5LSPUREQREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAQ7oiDTJA15uRv4hYdGPnf+pSUSykbox/iP8A1J0Y/wAR/wCpSUSykbox/iP/AFJ0Y/xH/qUlEspG6Mf4j/1J0Y/xH/qUlEspG6Mf4j/1J0Y/xH/qUlEspG6Mf4j/ANSdGP8AEf8AqUlEspG6Mf4j/wBSdGP8R/6lJRLKRujH+I/9SdGP8R/6lJRLKRujH+I/9SdGP8R/6lJRLKRujH+I/wDUnRj/ABH/AKlJRLKRujH+I/8AUnRj/Ef+pSUSykbox/iP/UnRj/Ef+pSUSykbox/iP/UvRTC/WLne5UhEspixgaLALJEQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQf/2Q==";

function Portfolio() {
  const [hovered, setHovered] = useState(null);
  const items = [
    { icon: "🎬", cat: "Vídeo · Instagram", name: "Reels para Nutricionista" },
    { icon: "🎨", cat: "Design · Carrossel", name: "Série de Carrosséis — Psicóloga" },
    { icon: "🚀", cat: "Landing Page · Vendas", name: "Página de Lançamento · Curso" },
    { icon: "⚙️", cat: "Kiwify · Plataforma", name: "Área de Membros Completa" },
    { icon: null, cat: "ManyChat · Automação", name: "Funil de Captura via DM", img: MANYCHAT_IMG },
    { icon: "+", cat: "Em breve", name: "Mais projetos em andamento", empty: true },
  ];

  return (
    <section id="portfolio" style={{ padding: "6rem 4rem", background: "#111111" }}>
      <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "4rem" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.3em", color: CRIMSON, opacity: 0.7 }}>03</span>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "0.06em" }}>
          PORTF<span style={{ color: CRIMSON }}>Ó</span>LIO
        </h2>
        <div style={{ flex: 1, height: "1px", background: "#1E1E1E" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "#1E1E1E", border: "1px solid #1E1E1E" }} className="fade-in">
        {items.map((item, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "relative", aspectRatio: "4/3", overflow: "hidden", cursor: "pointer",
              background: item.empty ? "rgba(199,37,26,0.04)" : "#141414",
              border: item.empty ? "1px dashed rgba(199,37,26,0.3)" : "none",
            }}>
            {/* Background */}
            {item.img ? (
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `url('data:image/jpeg;base64,${item.img}')`,
                backgroundSize: "cover", backgroundPosition: "center",
                transition: "transform 0.4s ease",
                transform: hovered === i ? "scale(1.05)" : "scale(1)",
              }} />
            ) : (
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "2.5rem",
                color: item.empty ? "rgba(199,37,26,0.3)" : "#1E1E1E",
                transition: "transform 0.35s",
                transform: hovered === i ? "scale(1.08)" : "scale(1)",
              }}>{item.icon}</div>
            )}

            {/* Overlay */}
            <div style={{
              position: "absolute", inset: 0, padding: "1.4rem",
              background: item.empty ? "none" : "linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 60%)",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              opacity: item.empty ? 1 : hovered === i ? 1 : 0,
              transition: "opacity 0.3s",
            }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.25em", color: CRIMSON, textTransform: "uppercase", marginBottom: "0.3rem" }}>{item.cat}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>{item.name}</div>
            </div>

            {/* Crimson border on hover */}
            <div style={{
              position: "absolute", inset: 0, border: `2px solid ${CRIMSON}`,
              opacity: hovered === i && !item.empty ? 1 : 0,
              transition: "opacity 0.2s", pointerEvents: "none",
            }} />
          </div>
        ))}
      </div>

      <p className="fade-in" style={{ textAlign: "center", marginTop: "2rem", fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.2em", color: "#5A5A5A", textTransform: "uppercase" }}>
        Quer ver cases completos? →{" "}
        <a href="https://www.instagram.com/levyomelo" target="_blank" style={{ color: CRIMSON, textDecoration: "none" }}>@levyomelo no Instagram</a>
      </p>
    </section>
  );
}

// ── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const skills = ["Edição de Vídeo","Design Gráfico","Copywriting","Páginas de Vendas","Kiwify","ManyChat","Instagram Strategy","Automação Digital"];

  return (
    <section id="sobre" style={{ padding: "6rem 4rem", background: "#0A0A0A" }}>
      <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "4rem" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.3em", color: CRIMSON, opacity: 0.7 }}>04</span>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "0.06em" }}>
          QUEM É <span style={{ color: CRIMSON }}>LEVY</span>
        </h2>
        <div style={{ flex: 1, height: "1px", background: "#1E1E1E" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "5rem", alignItems: "start" }}>
        {/* Photo */}
        <div className="fade-in" style={{ position: "relative" }}>
          <div style={{
            width: "100%", aspectRatio: "3/4", background: "#141414",
            border: "1px solid #1E1E1E", display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column", gap: "0.5rem",
            clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
            overflow: "hidden",
          }}>
            <div style={{ fontSize: "3rem", color: "#1E1E1E" }}>📷</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#5A5A5A", letterSpacing: "0.3em", textTransform: "uppercase" }}>Sua foto aqui</div>
          </div>
          <div style={{
            position: "absolute", bottom: "-1rem", right: "-1rem",
            background: CRIMSON, padding: "0.6rem 1rem",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.9rem", letterSpacing: "0.12em",
          }}>LEVY MELO</div>
        </div>

        {/* Content */}
        <div className="fade-in">
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "0.05em", lineHeight: 1, marginBottom: "0.5rem" }}>
            LEVY<br />MELO
          </h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.3em", color: CRIMSON, textTransform: "uppercase", marginBottom: "2rem" }}>
            Dev de Sistemas · Especialista em Presença Digital para Saúde
          </p>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(240,236,232,0.7)", marginBottom: "1.4rem", maxWidth: "560px" }}>
            Sou desenvolvedor de sistemas especializado na estruturação digital de profissionais da saúde e terapias. Atuo na interseção entre tecnologia, design e estratégia de marketing.
          </p>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(240,236,232,0.7)", marginBottom: "2.4rem", maxWidth: "560px" }}>
            Cada especialidade foi construída de forma prática. Hoje, ofereço um serviço completo e personalizado — sem enrolação, sem linguagem técnica. Só você, eu e resultado.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {skills.map((s, i) => (
              <div key={i} style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.63rem", letterSpacing: "0.15em",
                textTransform: "uppercase", padding: "0.5rem 0.8rem",
                border: "1px solid #1E1E1E", color: "rgba(240,236,232,0.55)",
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}>
                <span style={{ width: "4px", height: "4px", background: CRIMSON, borderRadius: "50%", flexShrink: 0 }} />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section id="contato" style={{ background: "#141414", borderTop: "1px solid #1E1E1E", textAlign: "center", padding: "7rem 4rem", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(7rem,18vw,22rem)",
        color: "rgba(199,37,26,0.035)", whiteSpace: "nowrap", pointerEvents: "none",
        letterSpacing: "-0.02em",
      }}>VAMOS?</div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <p className="fade-in" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.3em", textTransform: "uppercase", color: CRIMSON, marginBottom: "1.4rem" }}>
          Próximo passo
        </p>
        <h2 className="fade-in" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.4rem,5vw,5rem)", lineHeight: 1, letterSpacing: "0.05em", marginBottom: "1.2rem" }}>
          PRONTO PARA<br />ESCALAR?
        </h2>
        <p className="fade-in" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.76rem", color: "#5A5A5A", maxWidth: "480px", margin: "0 auto 3rem", lineHeight: 1.7, letterSpacing: "0.08em" }}>
          Sem burocracia. Sem espera. Entre em contato e vamos conversar sobre o que você precisa para vender mais.
        </p>
        <div className="fade-in" style={{ display: "flex", justifyContent: "center" }}>
          <a href="https://wa.me/5585984035152?text=Olá%20Levy%2C%20vim%20pelo%20seu%20site!" target="_blank"
            style={{
              background: CRIMSON, color: "#fff", padding: "0.9rem 2.4rem",
              fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.22em",
              textTransform: "uppercase", textDecoration: "none", display: "inline-block",
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              animation: "pulse-ring 2.5s ease infinite",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseEnter={e => { e.target.style.background = CRIMSON_DIM; e.target.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.target.style.background = CRIMSON; e.target.style.transform = "none"; }}>
            📲 WhatsApp Agora
          </a>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const links = [
    { icon: "📸", label: "@levyomelo", href: "https://www.instagram.com/levyomelo" },
    { icon: "📲", label: "+55 85 98403-5152", href: "https://wa.me/5585984035152" },
    { icon: "✉️", label: "levyoliveiramelo@gmail.com", href: "mailto:levyoliveiramelo@gmail.com" },
  ];
  const [hov, setHov] = useState(null);
  return (
    <footer style={{
      background: "#0A0A0A", borderTop: "1px solid #1E1E1E",
      padding: "3rem 4rem", display: "flex", justifyContent: "space-between",
      alignItems: "center", flexWrap: "wrap", gap: "1.5rem",
    }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: "0.12em" }}>
        LEVY<span style={{ color: CRIMSON }}>.</span>MELO
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
        {links.map((l, i) => (
          <a key={i} href={l.href} target={l.href.startsWith("mailto") ? undefined : "_blank"}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{
              fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.15em",
              color: hov === i ? CRIMSON : "#5A5A5A", textDecoration: "none",
              transition: "color 0.2s", display: "flex", alignItems: "center", gap: "0.5rem",
            }}>
            <span>{l.icon}</span> {l.label}
          </a>
        ))}
      </div>
      <div style={{ width: "100%", textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.2em", color: "#1E1E1E", textTransform: "uppercase" }}>
        © 2025 Levy Melo · Dev de Sistemas · Todos os direitos reservados
      </div>
    </footer>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="noise-overlay" />
      <CustomCursor />
      <Nav scrolled={scrolled} />
      <Hero />
      <StatsBar />
      <Services />
      <Audience />
      <Portfolio />
      <About />
      <CTA />
      <Footer />
    </>
  );
}
