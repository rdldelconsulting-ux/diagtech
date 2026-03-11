import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

// ─── UTILISATEURS ─────────────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "Admin DiagTech", login: "admin", password: "admin123", role: "admin", initials: "AD" },
  { id: 2, name: "Jean Lefebvre", login: "jean.l", password: "tech123", role: "technicien", initials: "JL" },
  { id: 3, name: "Sara Moulin", login: "sara.m", password: "tech123", role: "technicien", initials: "SM" },
  { id: 4, name: "Karim Bensaid", login: "karim.b", password: "tech123", role: "technicien", initials: "KB" },
];

// ─── DONNÉES ──────────────────────────────────────────────────────────────
const CLIENTS = [
  { name: "Renault Industrie", address: "12 Rue de la Manufacture, 92100 Boulogne", phone: "+33 1 42 55 88 00", email: "maintenance@renault-ind.fr" },
  { name: "Airbus MRO", address: "5 Avenue de l'Aviation, 31700 Blagnac", phone: "+33 5 61 93 33 33", email: "technique@airbus-mro.com" },
  { name: "Saint-Gobain Usine Nord", address: "8 Zone Industrielle, 59500 Douai", phone: "+33 3 27 88 22 11", email: "ops@sgobain-nord.fr" },
  { name: "Michelin Clermont", address: "23 Place des Carmes, 63000 Clermont-Ferrand", phone: "+33 4 73 98 11 00", email: "quality@michelin-clm.com" },
  { name: "Total Raffinage", address: "2 Route de la Raffinerie, 76700 Gonfreville", phone: "+33 2 35 25 75 00", email: "maint@total-raf.fr" },
];

const ZONES = ["Zone A – Fonderie", "Zone B – Assemblage", "Zone C – Peinture", "Zone D – Logistique", "Zone E – Contrôle Qualité"];
const LIGNES = { "Zone A – Fonderie": ["Ligne 1 – Coulée", "Ligne 2 – Forgeage", "Ligne 3 – Traitement thermique"], "Zone B – Assemblage": ["Ligne 4 – Pré-montage", "Ligne 5 – Montage principal", "Ligne 6 – Finition"], "Zone C – Peinture": ["Ligne 7 – Cataphorèse", "Ligne 8 – Apprêt", "Ligne 9 – Laque finale"], "Zone D – Logistique": ["Ligne 10 – Réception", "Ligne 11 – Expédition"], "Zone E – Contrôle Qualité": ["Ligne 12 – Tests fonctionnels", "Ligne 13 – Métrologie"] };
const MACHINES = { "Ligne 1 – Coulée": ["Four à induction #1", "Four à induction #2", "Robot coulée"], "Ligne 2 – Forgeage": ["Presse hydraulique 500T", "Marteau-pilon", "Découpeuse laser"], "Ligne 3 – Traitement thermique": ["Four de recuit", "Bain trempe"], "Ligne 4 – Pré-montage": ["Poste vissage automatique", "Convoyeur PMA-01"], "Ligne 5 – Montage principal": ["Bras robot KUKA KR200", "Table tournante", "Perceuse CNC"], "Ligne 6 – Finition": ["Polisseuse automatique", "Système de contrôle vision"], "Ligne 7 – Cataphorèse": ["Cuve cataphorèse", "Redresseur 2000A"], "Ligne 8 – Apprêt": ["Cabine projection apprêt", "Four séchage"], "Ligne 9 – Laque finale": ["Robot peinture ABB", "Four polymérisation"], "Ligne 10 – Réception": ["Pont roulant 10T", "Transpalette électrique"], "Ligne 11 – Expédition": ["Cercleuse automatique", "Palettiseur"], "Ligne 12 – Tests fonctionnels": ["Banc de test #1", "Analyseur vibration"], "Ligne 13 – Métrologie": ["CMM Zeiss Contura", "Rugosimètre"] };

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function nowStr() { return new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

const INITIAL_FORM = { client: "", address: "", phone: "", email: "", zone: "", ligne: "", machine: "", etatGeneral: "", statut: "", anomalies: "", observations: "", images: [] };

// ─── ICÔNES ───────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  factory: "M2 20V8l10-6 10 6v12H2zm5 0v-5h4v5H7zm6 0v-5h4v5h-4z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  camera: ["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z", "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  pdf: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  mail: ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"],
  history: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5", "M12 7v5l4 2"],
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  check: "M20 6L9 17l-5-5",
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  eyeOff: ["M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24", "M1 1l22 22"],
  close: "M18 6L6 18M6 6l12 12",
  chevronDown: "M6 9l6 6 6-6",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  lock: ["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z", "M7 11V7a5 5 0 0 1 10 0v4"],
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────
const Badge = ({ text, color }) => {
  const colors = { bon: "#22c55e", moyen: "#f59e0b", mauvais: "#ef4444", service: "#3b82f6", "hors-service": "#6b7280" };
  return <span style={{ background: colors[color] + "22", color: colors[color], border: `1px solid ${colors[color]}44`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{text}</span>;
};

const Field = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "#f59e0b", marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{hint}</div>}
  </div>
);

const Input = ({ value, onChange, placeholder, type = "text", readOnly }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
    style={{ width: "100%", background: readOnly ? "#0f172a" : "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: readOnly ? "#64748b" : "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: readOnly ? "default" : "text" }} />
);

const Select = ({ value, onChange, options, placeholder }) => (
  <div style={{ position: "relative" }}>
    <select value={value} onChange={onChange}
      style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 36px 10px 14px", color: value ? "#e2e8f0" : "#64748b", fontSize: 14, outline: "none", appearance: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={typeof o === "string" ? o : o.name} value={typeof o === "string" ? o : o.name}>{typeof o === "string" ? o : o.name}</option>)}
    </select>
    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>
      <Icon d={ICONS.chevronDown} size={16} />
    </div>
  </div>
);

const Textarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }} />
);

const RadioGroup = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    {options.map(opt => (
      <button key={opt.value} onClick={() => onChange(opt.value)}
        style={{ flex: 1, minWidth: 90, padding: "10px 8px", borderRadius: 8, border: `2px solid ${value === opt.value ? opt.activeColor : "#334155"}`, background: value === opt.value ? opt.activeColor + "22" : "#1e293b", color: value === opt.value ? opt.activeColor : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>{opt.icon}</span> {opt.label}
      </button>
    ))}
  </div>
);

// ─── PAGE DE CONNEXION ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError("");
    if (!login || !password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.login === login.trim() && u.password === password);
      if (user) { onLogin(user); }
      else { setError("Identifiant ou mot de passe incorrect."); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 340, animation: "fadeInUp 0.5s ease" }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px", background: "linear-gradient(135deg, #f59e0b, #b45309)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(245,158,11,0.3)" }}>
            <Icon d={ICONS.wrench} size={34} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", letterSpacing: 2, marginBottom: 4 }}>
            DIAG<span style={{ color: "#f59e0b" }}>TECH</span>
          </h1>
          <p style={{ fontSize: 11, color: "#475569", letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>
            Diagnostic Technique
          </p>
        </div>

        {/* FORMULAIRE */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon d={ICONS.lock} size={13} color="#64748b" /> Connexion
          </div>

          {/* LOGIN */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Identifiant</label>
            <input value={login} onChange={e => setLogin(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="votre.login" autoCapitalize="none" autoCorrect="off"
              style={{ width: "100%", background: "#0f172a", border: `1px solid ${error ? "#ef4444" : "#334155"}`, borderRadius: 8, padding: "12px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {/* MOT DE PASSE */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
                type={showPwd ? "text" : "password"} placeholder="••••••••"
                style={{ width: "100%", background: "#0f172a", border: `1px solid ${error ? "#ef4444" : "#334155"}`, borderRadius: 8, padding: "12px 44px 12px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              <button onClick={() => setShowPwd(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0 }}>
                <Icon d={showPwd ? ICONS.eyeOff : ICONS.eye} size={18} color="#475569" />
              </button>
            </div>
          </div>

          {/* ERREUR */}
          {error && (
            <div style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              ⚠ {error}
            </div>
          )}

          {/* BOUTON */}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: loading ? "#334155" : "linear-gradient(135deg, #f59e0b, #b45309)", color: loading ? "#64748b" : "#0f172a", fontWeight: 800, fontSize: 15, cursor: loading ? "default" : "pointer", fontFamily: "inherit", letterSpacing: 0.5, transition: "all 0.2s", boxShadow: loading ? "none" : "0 4px 20px rgba(245,158,11,0.3)" }}>
            {loading ? "Vérification…" : "Se connecter"}
          </button>
        </div>

        {/* AIDE */}
        <div style={{ marginTop: 20, background: "#1e293b44", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>Comptes disponibles</div>
          {USERS.map(u => (
            <div key={u.id} onClick={() => { setLogin(u.login); setPassword(u.password); setError(""); }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{u.login}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 6, background: u.role === "admin" ? "#7c3aed22" : "#1e3a5f", color: u.role === "admin" ? "#a78bfa" : "#60a5fa" }}>
                {u.role}
              </span>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── STEPS / FORM ────────────────────────────────────────────────────────
const steps = [
  { label: "Client", icon: ICONS.user },
  { label: "Localisation", icon: ICONS.map },
  { label: "Diagnostic", icon: ICONS.wrench },
  { label: "Photos", icon: ICONS.camera },
];

const StepBar = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "0 4px", marginBottom: 24 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: i < current ? "#f59e0b" : i === current ? "#f59e0b22" : "#1e293b", border: `2px solid ${i <= current ? "#f59e0b" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
            {i < current ? <Icon d={ICONS.check} size={16} color="#f59e0b" /> : <Icon d={s.icon} size={16} color={i === current ? "#f59e0b" : "#475569"} />}
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: i === current ? "#f59e0b" : i < current ? "#94a3b8" : "#475569" }}>{s.label}</span>
        </div>
        {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < current ? "#f59e0b" : "#1e293b", margin: "0 4px", marginBottom: 16, transition: "all 0.3s" }} />}
      </div>
    ))}
  </div>
);

const HistoryCard = ({ diag, onView, onDelete }) => (
  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div>
        <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>{diag.client || "Client inconnu"}</div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{diag.date} · <span style={{ color: "#475569" }}>{diag.technicien}</span></div>
      </div>
      {diag.etatGeneral && <Badge text={diag.etatGeneral} color={diag.etatGeneral} />}
    </div>
    <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>
      {[diag.zone, diag.ligne, diag.machine].filter(Boolean).join(" › ")}
    </div>
    {diag.images && diag.images.length > 0 && (
      <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
        {diag.images.slice(0, 4).map(img => (
          <img key={img.id} src={img.url} alt={img.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #334155" }} />
        ))}
        {diag.images.length > 4 && (
          <div style={{ width: 60, height: 60, borderRadius: 8, background: "#0f172a", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>+{diag.images.length - 4}</div>
        )}
      </div>
    )}
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => onView(diag)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <Icon d={ICONS.eye} size={14} /> Voir
      </button>
      <button onClick={() => onDelete(diag.id)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ef444433", background: "#ef444411", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
        <Icon d={ICONS.trash} size={14} />
      </button>
    </div>
  </div>
);

function generatePDFContent(diag) {
  const etatColor = { bon: "#22c55e", moyen: "#f59e0b", mauvais: "#ef4444" }[diag.etatGeneral] || "#94a3b8";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family: 'Segoe UI', sans-serif; color: #1e293b; } .header { background: linear-gradient(135deg, #0f172a, #1e3a5f); color: white; padding: 32px; display: flex; justify-content: space-between; align-items: center; } .logo { font-size: 22px; font-weight: 900; letter-spacing: 2px; } .logo span { color: #f59e0b; } .body { padding: 32px; } .section { margin-bottom: 28px; } .section-title { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; margin-bottom: 14px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .field label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; } .field p { font-size: 14px; color: #1e293b; margin-top: 2px; } .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: white; background: ${etatColor}; } .box { border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.6; } .footer { background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 20px 32px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; } .sign { border-top: 1px solid #cbd5e1; width: 160px; padding-top: 6px; text-align: center; font-size: 10px; } .img-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; } .img-grid img { width: 100%; height: 90px; object-fit: cover; border-radius: 6px; }</style></head><body>
  <div class="header"><div><div class="logo">DIAG<span>TECH</span></div><div style="font-size:11px;opacity:.6;margin-top:4px">Rapport #${diag.id?.slice(-6).toUpperCase()} · Par ${diag.technicien || "—"}</div></div><div style="text-align:right;font-size:12px;opacity:.7">${diag.date}</div></div>
  <div class="body">
    <div class="section"><div class="section-title">Informations Client</div><div class="grid"><div class="field"><label>Client</label><p>${diag.client || "—"}</p></div><div class="field"><label>Email</label><p>${diag.email || "—"}</p></div><div class="field"><label>Adresse</label><p>${diag.address || "—"}</p></div><div class="field"><label>Téléphone</label><p>${diag.phone || "—"}</p></div></div></div>
    <div class="section"><div class="section-title">Localisation</div><div class="grid"><div class="field"><label>Zone</label><p>${diag.zone || "—"}</p></div><div class="field"><label>Ligne</label><p>${diag.ligne || "—"}</p></div><div class="field"><label>Machine</label><p>${diag.machine || "—"}</p></div></div></div>
    <div class="section"><div class="section-title">Diagnostic</div><div style="display:flex;gap:12px;margin-bottom:12px"><div class="field"><label>État</label><div style="margin-top:4px"><span class="badge">${diag.etatGeneral || "—"}</span></div></div><div class="field"><label>Statut</label><div style="margin-top:4px"><span class="badge" style="background:${diag.statut === "En service" ? "#3b82f6" : "#6b7280"}">${diag.statut || "—"}</span></div></div></div>${diag.anomalies ? `<div class="field"><label>Anomalies</label><div class="box" style="background:#fef2f2;color:#7f1d1d;margin-top:4px">${diag.anomalies}</div></div>` : ""}</div>
    ${diag.observations ? `<div class="section"><div class="section-title">Observations</div><div class="box" style="background:#f8fafc;color:#475569">${diag.observations}</div></div>` : ""}
    ${diag.images?.length ? `<div class="section"><div class="section-title">Photos (${diag.images.length})</div><div class="img-grid">${diag.images.map(i => `<img src="${i.url}" />`).join("")}</div></div>` : ""}
  </div>
  <div class="footer"><div>DiagTech · ${diag.date}</div><div class="sign">Signature technicien</div></div>
</body></html>`;
}

// ─── APPLICATION PRINCIPALE ──────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("form");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [history, setHistory] = useState([]);
  const [clients, setClients] = useState([]);
  const [previewDiag, setPreviewDiag] = useState(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  // ── CHARGEMENT DEPUIS SUPABASE ──────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      // Charger les clients
      const { data: dbClients } = await supabase.from("clients").select("*");
      if (dbClients && dbClients.length > 0) {
        setClients(dbClients);
      }
      // Charger les diagnostics
      const { data: dbDiags } = await supabase.from("diagnostics").select("*").order("created_at", { ascending: false });
      if (dbDiags) {
        setHistory(dbDiags.map(d => ({
          id: d.id,
          date: d.date,
          technicien: d.technicien || "",
          client: d.client,
          address: d.address,
          phone: d.phone,
          email: d.email,
          zone: d.zone,
          ligne: d.ligne,
          machine: d.machine,
          etatGeneral: d.etat_general,
          statut: d.statut,
          anomalies: d.anomalies,
          observations: d.observations,
          images: d.images || [],
          modified_at: d.modified_at,
        })));
      }
    };
    loadData();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleClientChange = (name) => {
    const c = clients.find(c => c.name === name);
    if (c) setForm(f => ({ ...f, client: name, address: c.address, phone: c.phone, email: c.email }));
    else setForm(f => ({ ...f, client: name, address: "", phone: "", email: "" }));
  };

  const handleZoneChange = (z) => setForm(f => ({ ...f, zone: z, ligne: "", machine: "" }));
  const handleLigneChange = (l) => setForm(f => ({ ...f, ligne: l, machine: "" }));

  const handleImage = (e) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, images: [...f.images, { id: generateId(), url: ev.target.result, name: file.name }] }));
      reader.readAsDataURL(file);
    });
  };

  // ── UPLOAD IMAGES VERS SUPABASE STORAGE ─────────────────────────────────
  function base64ToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  const uploadImages = async (images) => {
    const uploaded = [];
    for (const img of images) {
      if (img.url && img.url.startsWith("http")) {
        uploaded.push(img);
        continue;
      }
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const blob = base64ToBlob(img.url);
      const { error } = await supabase.storage.from("rapports").upload(fileName, blob, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("rapports").getPublicUrl(fileName);
        uploaded.push({ ...img, url: urlData.publicUrl });
      }
    }
    return uploaded;
  };

  const handleSave = async () => {
    try {
      // Upload images
      const uploadedImages = await uploadImages(form.images);

      // Upsert client
      await supabase.from("clients").upsert({ name: form.client, address: form.address, phone: form.phone, email: form.email }, { onConflict: "name" });

      // Insert diagnostic
      const diagId = generateId();
      const diagDate = nowStr();
      const { error } = await supabase.from("diagnostics").insert({
        id: diagId,
        date: diagDate,
        technicien: currentUser.name,
        client: form.client,
        address: form.address,
        phone: form.phone,
        email: form.email,
        zone: form.zone,
        ligne: form.ligne,
        machine: form.machine,
        etat_general: form.etatGeneral,
        statut: form.statut,
        anomalies: form.anomalies,
        observations: form.observations,
        images: uploadedImages,
      });

      if (error) throw error;

      const diag = { ...form, id: diagId, date: diagDate, technicien: currentUser.name, images: uploadedImages };
      setHistory(h => [diag, ...h]);
      setSaved(true);
      showToast("Diagnostic sauvegarde !");
    } catch (err) {
      showToast("Erreur : " + err.message);
    }
  };

  const handleExportPDF = (diag) => {
    const html = generatePDFContent(diag || { ...form, id: generateId(), date: nowStr(), technicien: currentUser.name });
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `rapport-${Date.now()}.html`; a.click();
    showToast("Rapport exporté !");
  };

  const handleSendEmail = (diag) => {
    const d = diag || { ...form, date: nowStr(), technicien: currentUser.name };
    const subject = encodeURIComponent(`Rapport Diagnostic – ${d.client} – ${d.date}`);
    const body = encodeURIComponent(`Bonjour,\n\nRapport de diagnostic technique.\n\nClient : ${d.client}\nMachine : ${d.machine}\nÉtat : ${d.etatGeneral}\nStatut : ${d.statut}\nTechnicien : ${d.technicien}\nAnomalies : ${d.anomalies || "Aucune"}\n\nCordialement`);
    window.location.href = `mailto:${d.email}?subject=${subject}&body=${body}`;
  };

  const handleLogout = () => { setCurrentUser(null); setView("form"); setStep(0); setForm(INITIAL_FORM); };

  // ── ÉCRAN DE CONNEXION ──────────────────────────────────────────────────
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  // ── STEPS ───────────────────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 0) return (
      <div>
        <Field label="Client" required><Select value={form.client} onChange={e => handleClientChange(e.target.value)} options={clients} placeholder="Sélectionner un client" /></Field>
        <Field label="Adresse" hint="Renseignée automatiquement"><Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Adresse" readOnly={!!clients.find(c => c.name === form.client)} /></Field>
        <Field label="Téléphone" hint="Renseigné automatiquement"><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+33 …" readOnly={!!clients.find(c => c.name === form.client)} /></Field>
        <Field label="Email" hint="Renseigné automatiquement"><Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@…" readOnly={!!clients.find(c => c.name === form.client)} /></Field>
      </div>
    );
    if (step === 1) return (
      <div>
        <Field label="Zone" required><Select value={form.zone} onChange={e => handleZoneChange(e.target.value)} options={ZONES} placeholder="Choisir une zone" /></Field>
        <Field label="Ligne de production" required><Select value={form.ligne} onChange={e => handleLigneChange(e.target.value)} options={form.zone ? (LIGNES[form.zone] || []) : []} placeholder={form.zone ? "Choisir une ligne" : "Sélectionnez d'abord une zone"} /></Field>
        <Field label="Machine" required><Select value={form.machine} onChange={e => set("machine", e.target.value)} options={form.ligne ? (MACHINES[form.ligne] || []) : []} placeholder={form.ligne ? "Choisir une machine" : "Sélectionnez d'abord une ligne"} /></Field>
        {form.zone && form.ligne && form.machine && (
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#f59e0b", textTransform: "uppercase", marginBottom: 6 }}>Arborescence</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>{form.zone}<br /><span style={{ color: "#475569" }}>└ </span>{form.ligne}<br /><span style={{ color: "#475569" }}>  └ </span><span style={{ color: "#e2e8f0" }}>{form.machine}</span></div>
          </div>
        )}
      </div>
    );
    if (step === 2) return (
      <div>
        <Field label="État général" required><RadioGroup value={form.etatGeneral} onChange={v => set("etatGeneral", v)} options={[{ value: "bon", label: "Bon", icon: "✅", activeColor: "#22c55e" }, { value: "moyen", label: "Moyen", icon: "⚠️", activeColor: "#f59e0b" }, { value: "mauvais", label: "Mauvais", icon: "❌", activeColor: "#ef4444" }]} /></Field>
        <Field label="Statut" required><RadioGroup value={form.statut} onChange={v => set("statut", v)} options={[{ value: "En service", label: "En service", icon: "🟢", activeColor: "#3b82f6" }, { value: "Hors service", label: "Hors service", icon: "🔴", activeColor: "#6b7280" }]} /></Field>
        <Field label="Anomalies constatées"><Textarea value={form.anomalies} onChange={e => set("anomalies", e.target.value)} placeholder="Bruits, vibrations, fuites, défauts visuels…" rows={4} /></Field>
        <Field label="Observations"><Textarea value={form.observations} onChange={e => set("observations", e.target.value)} placeholder="Commentaires, recommandations…" rows={3} /></Field>
      </div>
    );
    if (step === 3) return (
      <div>
        <Field label="Photos" hint="Photo directe ou import depuis la galerie">
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button onClick={() => { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click(); }} style={{ flex: 1, padding: "14px", borderRadius: 10, border: "2px dashed #334155", background: "#1e293b", color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Icon d={ICONS.camera} size={24} color="#f59e0b" /><span style={{ fontWeight: 700, color: "#e2e8f0" }}>Appareil photo</span>
            </button>
            <button onClick={() => { fileRef.current.removeAttribute("capture"); fileRef.current.click(); }} style={{ flex: 1, padding: "14px", borderRadius: 10, border: "2px dashed #334155", background: "#1e293b", color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Icon d={ICONS.upload} size={24} color="#3b82f6" /><span style={{ fontWeight: 700, color: "#e2e8f0" }}>Galerie</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImage} style={{ display: "none" }} />
        </Field>
        {form.images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {form.images.map(img => (
              <div key={img.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }}>
                <img src={img.url} alt={img.name} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                <button onClick={() => setForm(f => ({ ...f, images: f.images.filter(i => i.id !== img.id) }))} style={{ position: "absolute", top: 6, right: 6, background: "#ef444499", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={ICONS.close} size={12} color="white" />
                </button>
              </div>
            ))}
          </div>
        )}
        {form.images.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "#475569", fontSize: 13 }}><div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>Aucune photo</div>}
        <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 12 }}>Récapitulatif</div>
          {[["Technicien", currentUser.name], ["Client", form.client], ["Machine", form.machine], ["État", form.etatGeneral], ["Statut", form.statut], ["Photos", form.images.length + " image(s)"]].map(([k, v]) => v ? (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>{k}</span><span style={{ color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
            </div>
          ) : null)}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={handleSave} disabled={saved} style={{ flex: 1, padding: "14px", borderRadius: 10, border: "none", background: saved ? "#1e293b" : "#f59e0b", color: saved ? "#94a3b8" : "#0f172a", fontWeight: 800, fontSize: 14, cursor: saved ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={saved ? ICONS.check : ICONS.save} size={18} color={saved ? "#94a3b8" : "#0f172a"} /> {saved ? "Sauvegardé" : "Sauvegarder"}
          </button>
          <button onClick={() => handleExportPDF()} style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={ICONS.pdf} size={18} color="#3b82f6" /> PDF
          </button>
          <button onClick={() => handleSendEmail()} style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={ICONS.mail} size={18} color="#22c55e" /> Email
          </button>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const d = previewDiag; if (!d) return null;
    return (
      <div>
        <button onClick={() => { setView("history"); setPreviewDiag(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>← Retour</button>
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#e2e8f0", marginBottom: 4 }}>{d.client}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{d.date} · {d.technicien}</div>
          {[["Adresse", d.address], ["Téléphone", d.phone], ["Email", d.email]].map(([k, v]) => v ? <div key={k} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}><span style={{ color: "#475569" }}>{k} : </span>{v}</div> : null)}
        </div>
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>Localisation</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{d.zone}<br /><span style={{ color: "#475569" }}>└ </span>{d.ligne}<br /><span style={{ color: "#475569" }}>  └ </span><span style={{ color: "#e2e8f0" }}>{d.machine}</span></div>
        </div>
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>Diagnostic</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>{d.etatGeneral && <Badge text={d.etatGeneral} color={d.etatGeneral} />}{d.statut && <Badge text={d.statut} color={d.statut === "En service" ? "service" : "hors-service"} />}</div>
          {d.anomalies && <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, color: "#fca5a5", marginBottom: 8 }}><strong>Anomalies :</strong> {d.anomalies}</div>}
          {d.observations && <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, color: "#94a3b8" }}><strong>Observations :</strong> {d.observations}</div>}
        </div>
        {d.images && d.images.length > 0 && (
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>Photos ({d.images.length})</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {d.images.map(img => (
                <div key={img.id} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }}>
                  <img src={img.url} alt={img.name} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => handleExportPDF(d)} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#93c5fd", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon d={ICONS.pdf} size={16} color="#93c5fd" /> PDF</button>
          <button onClick={() => handleSendEmail(d)} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "#14532d", color: "#86efac", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon d={ICONS.mail} size={16} color="#86efac" /> Envoyer</button>
        </div>
      </div>
    );
  };

  const navBtn = (icon, label, target) => (
    <button onClick={() => setView(target)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", border: "none", background: "transparent", color: view === target ? "#f59e0b" : "#475569", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
      <Icon d={icon} size={20} color={view === target ? "#f59e0b" : "#475569"} />{label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderBottom: "1px solid #1e293b", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>DIAG<span style={{ color: "#f59e0b" }}>TECH</span></div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1.5, textTransform: "uppercase" }}>{view === "form" ? steps[step].label : view === "history" ? "Historique" : "Rapport"}</div>
            </div>
            {/* UTILISATEUR CONNECTÉ */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{currentUser.name}</div>
                <div style={{ fontSize: 10, color: currentUser.role === "admin" ? "#a78bfa" : "#60a5fa", textTransform: "uppercase", letterSpacing: 1 }}>{currentUser.role}</div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #b45309)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{currentUser.initials}</div>
              <button onClick={handleLogout} title="Déconnexion" style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#64748b" }}>
                <Icon d={ICONS.logout} size={16} color="#64748b" />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENU */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {view === "form" && (
            <>
              <StepBar current={step} />
              {renderStep()}
              {step < 3 && (
                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  {step > 0 && <button onClick={() => { setStep(s => s - 1); setSaved(false); }} style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontWeight: 700, cursor: "pointer" }}>← Retour</button>}
                  <button onClick={() => { setStep(s => s + 1); setSaved(false); }} style={{ flex: 2, padding: "14px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#0f172a", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Suivant →</button>
                </div>
              )}
              {step === 3 && <button onClick={() => { setStep(2); setSaved(false); }} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }}>← Retour au diagnostic</button>}
            </>
          )}
          {view === "history" && !previewDiag && (
            <>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{history.length} rapport{history.length > 1 ? "s" : ""}</div>
              {history.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>Aucun diagnostic enregistré</div>}
              {history.map(d => <HistoryCard key={d.id} diag={d} onView={(d) => { setPreviewDiag(d); setView("preview"); }} onDelete={async (id) => { await supabase.from("diagnostics").delete().eq("id", id); setHistory(h => h.filter(x => x.id !== id)); }} />)}
            </>
          )}
          {view === "preview" && renderPreview()}
        </div>

        {/* NAV BAS */}
        <div style={{ background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", position: "sticky", bottom: 0 }}>
          <button onClick={() => { setView("form"); setStep(0); setForm(INITIAL_FORM); setSaved(false); setPreviewDiag(null); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", border: "none", background: "transparent", color: view === "form" ? "#f59e0b" : "#475569", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            <Icon d={ICONS.factory} size={20} color={view === "form" ? "#f59e0b" : "#475569"} />Nouveau
          </button>
          {navBtn(ICONS.history, "Historique", "history")}
        </div>

        {/* TOAST */}
        {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#14532d", color: "#86efac", padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 8px 32px #00000066", border: "1px solid #22c55e44" }}>✓ {toast}</div>}
      </div>
    </div>
  );
}
