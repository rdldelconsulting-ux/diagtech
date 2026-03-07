import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";
import html2pdf from "html2pdf.js";

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function nowStr() { return new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

const INITIAL_FORM = { client: "", address: "", phone: "", email: "", zone: "", ligne: "", machine: "", etatGeneral: "", statut: "", anomalies: "", observations: "", images: [] };

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
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  check: "M20 6L9 17l-5-5",
  alert: ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4M12 17h.01"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  close: "M18 6L6 18M6 6l12 12",
  chevronDown: "M6 9l6 6 6-6",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
};

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

const HistoryCard = ({ diag, onView, onEdit, onDelete }) => (
  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div>
        <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>{diag.client || "Client inconnu"}</div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{diag.date}</div>
        {diag.modifiedAt && <div style={{ color: "#f59e0b", fontSize: 10, marginTop: 2, fontStyle: "italic" }}>Rapport modifie le {diag.modifiedAt}</div>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {diag.etatGeneral && <Badge text={diag.etatGeneral} color={diag.etatGeneral} />}
      </div>
    </div>
    <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>
      {[diag.zone, diag.ligne, diag.machine].filter(Boolean).join(" › ")}
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => onView(diag)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <Icon d={ICONS.eye} size={14} /> Voir
      </button>
      <button onClick={() => onEdit(diag)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #3b82f633", background: "#3b82f611", color: "#3b82f6", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <Icon d={ICONS.edit} size={14} /> Modifier
      </button>
      <button onClick={() => onDelete(diag.id)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ef444433", background: "#ef444411", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
        <Icon d={ICONS.trash} size={14} />
      </button>
    </div>
  </div>
);

function generatePDFContent(diag) {
  const etatColor = { bon: "#22c55e", moyen: "#f59e0b", mauvais: "#ef4444" }[diag.etatGeneral] || "#94a3b8";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family: 'Segoe UI', sans-serif; color: #1e293b; background: #fff; } .header { background: linear-gradient(135deg, #0f172a, #1e3a5f); color: white; padding: 32px; display: flex; justify-content: space-between; align-items: center; } .logo { font-size: 22px; font-weight: 900; letter-spacing: 2px; } .logo span { color: #f59e0b; } .ref { font-size: 12px; opacity: .6; margin-top: 4px; } .date { text-align: right; font-size: 12px; opacity: .7; } .body { padding: 32px; } .section { margin-bottom: 28px; } .section-title { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; margin-bottom: 14px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .field label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; } .field p { font-size: 14px; color: #1e293b; margin-top: 2px; } .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: white; background: ${etatColor}; } .anomaly-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; font-size: 13px; color: #7f1d1d; line-height: 1.6; } .obs-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px; color: #475569; line-height: 1.6; } .footer { background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; } .sign { border-top: 1px solid #cbd5e1; width: 160px; padding-top: 6px; text-align: center; font-size: 10px; color: #94a3b8; } .img-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; } .img-grid img { width: 100%; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }</style></head><body><div class="header"><div><div class="logo">DIAG<span>TECH</span></div><div class="ref">Rapport #${diag.id?.slice(-6).toUpperCase()}</div></div><div class="date">${diag.date}</div></div><div class="body"><div class="section"><div class="section-title">Informations Client</div><div class="grid"><div class="field"><label>Client</label><p>${diag.client || "—"}</p></div><div class="field"><label>Email</label><p>${diag.email || "—"}</p></div><div class="field"><label>Adresse</label><p>${diag.address || "—"}</p></div><div class="field"><label>Téléphone</label><p>${diag.phone || "—"}</p></div></div></div><div class="section"><div class="section-title">Localisation</div><div class="grid"><div class="field"><label>Zone</label><p>${diag.zone || "—"}</p></div><div class="field"><label>Ligne</label><p>${diag.ligne || "—"}</p></div><div class="field"><label>Machine</label><p>${diag.machine || "—"}</p></div></div></div><div class="section"><div class="section-title">Diagnostic Technique</div><div style="margin-bottom: 12px; display: flex; gap: 12px; flex-wrap: wrap;"><div class="field"><label>État général</label><div style="margin-top:4px"><span class="badge">${diag.etatGeneral || "—"}</span></div></div><div class="field"><label>Statut</label><div style="margin-top:4px"><span class="badge" style="background:${diag.statut === "En service" ? "#3b82f6" : "#6b7280"}">${diag.statut || "—"}</span></div></div></div>${diag.anomalies ? `<div class="field"><label>Anomalies constatées</label><div class="anomaly-box" style="margin-top:4px">${diag.anomalies}</div></div>` : ""}</div>${diag.observations ? `<div class="section"><div class="section-title">Observations & Remarques</div><div class="obs-box">${diag.observations}</div></div>` : ""}${diag.images?.length ? `<div class="section"><div class="section-title">Documentation photographique (${diag.images.length} photo${diag.images.length > 1 ? "s" : ""})</div><div class="img-grid">${diag.images.map(img => `<img src="${img.url}" alt="photo" />`).join("")}</div></div>` : ""}</div><div class="footer"><div>Généré par DiagTech Mobile • ${diag.date}</div><div class="sign">Signature technicien</div></div></body></html>`;
}

export default function App() {
  const [view, setView] = useState("form");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [clients, setClients] = useState([]);
  const [history, setHistory] = useState([]);
  const [zones, setZones] = useState([]);
  const [lignes, setLignes] = useState({});
  const [machines, setMachines] = useState({});
  const [newZone, setNewZone] = useState("");
  const [newLigne, setNewLigne] = useState("");
  const [newMachine, setNewMachine] = useState("");

  // Charger les données depuis Supabase au démarrage
  useEffect(() => {
    const load = async () => {
      const { data: c } = await supabase.from("clients").select("*").order("created_at");
      if (c) setClients(c.map(r => ({ name: r.name, address: r.address, phone: r.phone, email: r.email })));

      const { data: z } = await supabase.from("zones").select("*").order("created_at");
      if (z) setZones(z.map(r => r.name));

      const { data: l } = await supabase.from("lignes").select("*").order("created_at");
      if (l) {
        const map = {};
        l.forEach(r => { if (!map[r.zone_name]) map[r.zone_name] = []; map[r.zone_name].push(r.name); });
        setLignes(map);
      }

      const { data: m } = await supabase.from("machines").select("*").order("created_at");
      if (m) {
        const map = {};
        m.forEach(r => { if (!map[r.ligne_name]) map[r.ligne_name] = []; map[r.ligne_name].push(r.name); });
        setMachines(map);
      }

      const { data: d } = await supabase.from("diagnostics").select("*").order("created_at", { ascending: false });
      if (d) setHistory(d.map(r => ({ id: r.id, date: r.date, client: r.client, address: r.address, phone: r.phone, email: r.email, zone: r.zone, ligne: r.ligne, machine: r.machine, etatGeneral: r.etat_general, statut: r.statut, anomalies: r.anomalies, observations: r.observations, images: r.images || [], modifiedAt: r.modified_at || null })));
    };
    load();
  }, []);
  const [previewDiag, setPreviewDiag] = useState(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const [manualClient, setManualClient] = useState(false);
  const fileRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleClientChange = (name) => {
    const c = clients.find(c => c.name === name);
    if (c) setForm(f => ({ ...f, client: name, address: c.address, phone: c.phone, email: c.email }));
    else setForm(f => ({ ...f, client: name, address: "", phone: "", email: "" }));
  };

  const handleZoneChange = (z) => { setForm(f => ({ ...f, zone: z, ligne: "", machine: "" })); setNewLigne(""); setNewMachine(""); };
  const handleLigneChange = (l) => { setForm(f => ({ ...f, ligne: l, machine: "" })); setNewMachine(""); };

  const addZone = async () => {
    const z = newZone.trim();
    if (!z) return;
    if (zones.includes(z)) { showToast("Cette zone existe déjà", "error"); setNewZone(""); return; }
    const { error } = await supabase.from("zones").insert({ name: z });
    if (error) { showToast("Erreur : " + error.message, "error"); return; }
    setZones(prev => [...prev, z]);
    setForm(f => ({ ...f, zone: z, ligne: "", machine: "" }));
    setNewZone("");
    showToast("Zone ajoutée");
  };
  const addLigne = async () => {
    const l = newLigne.trim();
    if (!l || !form.zone) return;
    if ((lignes[form.zone] || []).includes(l)) { showToast("Cette ligne existe déjà", "error"); setNewLigne(""); return; }
    const { error } = await supabase.from("lignes").insert({ name: l, zone_name: form.zone });
    if (error) { showToast("Erreur : " + error.message, "error"); return; }
    setLignes(prev => ({ ...prev, [form.zone]: [...(prev[form.zone] || []), l] }));
    setForm(f => ({ ...f, ligne: l, machine: "" }));
    setNewLigne("");
    showToast("Ligne ajoutée");
  };
  const addMachine = async () => {
    const m = newMachine.trim();
    if (!m || !form.ligne) return;
    if ((machines[form.ligne] || []).includes(m)) { showToast("Cette machine existe déjà", "error"); setNewMachine(""); return; }
    const { error } = await supabase.from("machines").insert({ name: m, ligne_name: form.ligne });
    if (error) { showToast("Erreur : " + error.message, "error"); return; }
    setMachines(prev => ({ ...prev, [form.ligne]: [...(prev[form.ligne] || []), m] }));
    setForm(f => ({ ...f, machine: m }));
    setNewMachine("");
    showToast("Machine ajoutée");
  };

  const handleImage = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({ ...f, images: [...f.images, { id: generateId(), url: ev.target.result, name: file.name }] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => setForm(f => ({ ...f, images: f.images.filter(i => i.id !== id) }));

  const base64ToBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  };

  const uploadImages = async (diagId, images) => {
    const uploaded = [];
    for (const img of images) {
      try {
        const blob = img.url.startsWith("data:") ? base64ToBlob(img.url) : await (await fetch(img.url)).blob();
        const ext = blob.type.includes("png") ? "png" : "jpg";
        const fileName = `photos/${diagId}/${img.id}.${ext}`;
        const { error } = await supabase.storage.from("rapports").upload(fileName, blob, { contentType: blob.type, upsert: true });
        if (error) { showToast("Erreur photo : " + error.message, "error"); continue; }
        const { data } = supabase.storage.from("rapports").getPublicUrl(fileName);
        uploaded.push({ id: img.id, url: data.publicUrl, name: img.name });
      } catch (err) {
        showToast("Erreur photo : " + err.message, "error");
      }
    }
    return uploaded;
  };

  const handleSave = async () => {
    const diagId = generateId();
    const diag = { ...form, id: diagId, date: nowStr() };

    // Sauvegarder le client s'il est nouveau
    if (form.client && !clients.find(c => c.name === form.client)) {
      const newClient = { name: form.client, address: form.address, phone: form.phone, email: form.email };
      const { error } = await supabase.from("clients").insert(newClient);
      if (error) { showToast("Erreur client : " + error.message, "error"); return; }
      setClients(prev => [...prev, newClient]);
    }

    // Upload des photos
    let savedImages = [];
    if (form.images.length > 0) {
      showToast("Upload des photos...");
      savedImages = await uploadImages(diagId, form.images);
    }

    // Sauvegarder le diagnostic
    const { error } = await supabase.from("diagnostics").insert({
      id: diag.id, date: diag.date, client: diag.client, address: diag.address,
      phone: diag.phone, email: diag.email, zone: diag.zone, ligne: diag.ligne,
      machine: diag.machine, etat_general: diag.etatGeneral, statut: diag.statut,
      anomalies: diag.anomalies, observations: diag.observations,
      images: savedImages,
    });
    if (error) { showToast("Erreur diagnostic : " + error.message, "error"); return; }

    diag.images = savedImages;
    setHistory(h => [diag, ...h]);
    setSaved(true);
    setEditingId(null);
    showToast("Diagnostic sauvegardé avec succès !");
  };

  const handleUpdate = async () => {
    // Upload des nouvelles photos (celles en base64, pas déjà uploadées)
    const newImages = form.images.filter(img => img.url.startsWith("data:"));
    const existingImages = form.images.filter(img => !img.url.startsWith("data:"));
    let uploadedNew = [];
    if (newImages.length > 0) {
      showToast("Upload des nouvelles photos...");
      uploadedNew = await uploadImages(editingId, newImages);
    }
    const allImages = [...existingImages, ...uploadedNew];
    const modifiedAt = nowStr();

    const { error } = await supabase.from("diagnostics").update({
      client: form.client, address: form.address, phone: form.phone, email: form.email,
      zone: form.zone, ligne: form.ligne, machine: form.machine,
      etat_general: form.etatGeneral, statut: form.statut,
      anomalies: form.anomalies, observations: form.observations,
      images: allImages, modified_at: modifiedAt,
    }).eq("id", editingId);
    if (error) { showToast("Erreur modification : " + error.message, "error"); return; }

    setHistory(h => h.map(d => d.id === editingId ? { ...d, ...form, images: allImages, modifiedAt } : d));
    setSaved(true);
    setEditingId(null);
    showToast("Diagnostic modifié avec succès !");
  };

  const handleEditDiag = (diag) => {
    setForm({ client: diag.client, address: diag.address, phone: diag.phone, email: diag.email, zone: diag.zone, ligne: diag.ligne, machine: diag.machine, etatGeneral: diag.etatGeneral, statut: diag.statut, anomalies: diag.anomalies, observations: diag.observations, images: diag.images || [] });
    setEditingId(diag.id);
    setStep(0);
    setSaved(false);
    setPreviewDiag(null);
    setView("form");
  };

  const generatePDF = async (diag) => {
    const d = diag || { ...form, id: generateId(), date: nowStr() };
    const html = generatePDFContent(d);
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.width = "800px";
    document.body.appendChild(container);
    const pdf = await html2pdf().set({ margin: 0, filename: `rapport-${d.id}.pdf`, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(container).outputPdf("blob");
    document.body.removeChild(container);
    return { blob: pdf, diag: d };
  };

  const handleExportPDF = async (diag) => {
    showToast("Génération du PDF...");
    const { blob, diag: d } = await generatePDF(diag);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rapport-diagnostic-${d.id}.pdf`;
    a.click();
    showToast("PDF exporté !");
  };

  const handleSendEmail = async (diag) => {
    try {
      showToast("Génération du PDF...");
      const { blob, diag: d } = await generatePDF(diag);
      const fileName = `rapport-${Date.now()}.pdf`;

      // Upload sur Supabase Storage
      showToast("Upload du PDF...");
      const { error } = await supabase.storage.from("rapports").upload(fileName, blob, { contentType: "application/pdf", upsert: true });
      if (error) { showToast("Erreur upload : " + error.message, "error"); return; }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage.from("rapports").getPublicUrl(fileName);
      const pdfUrl = urlData.publicUrl;

      const subject = encodeURIComponent(`Rapport Diagnostic - ${d.client} - ${d.date}`);
      const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver le rapport de diagnostic technique via le lien ci-dessous :\n\n${pdfUrl}\n\nClient : ${d.client}\nMachine : ${d.machine}\nEtat : ${d.etatGeneral}\nStatut : ${d.statut}\nAnomalies : ${d.anomalies || "Aucune"}\n\nCordialement,\nL equipe technique DiagTech`);
      window.location.href = `mailto:${d.email}?subject=${subject}&body=${body}`;
      showToast("Email prepare avec le lien PDF !");
    } catch (err) {
      showToast("Erreur : " + err.message, "error");
    }
  };

  const navBtn = (icon, label, target) => (
    <button onClick={() => setView(target)}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", border: "none", background: "transparent", color: view === target ? "#f59e0b" : "#475569", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
      <Icon d={icon} size={20} color={view === target ? "#f59e0b" : "#475569"} />
      {label}
    </button>
  );

  const renderStep = () => {
    if (step === 0) return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => { setManualClient(false); setForm(f => ({ ...f, client: "", address: "", phone: "", email: "" })); }}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${!manualClient ? "#f59e0b" : "#334155"}`, background: !manualClient ? "#f59e0b22" : "#1e293b", color: !manualClient ? "#f59e0b" : "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Client existant
          </button>
          <button onClick={() => { setManualClient(true); setForm(f => ({ ...f, client: "", address: "", phone: "", email: "" })); }}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${manualClient ? "#f59e0b" : "#334155"}`, background: manualClient ? "#f59e0b22" : "#1e293b", color: manualClient ? "#f59e0b" : "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Nouveau client
          </button>
        </div>
        {!manualClient ? (
          <>
            <Field label="Client" required>
              <Select value={form.client} onChange={e => handleClientChange(e.target.value)} options={clients} placeholder="Sélectionner un client" />
            </Field>
            <Field label="Adresse" hint="Renseignée automatiquement">
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Adresse de l'usine" readOnly={!!clients.find(c => c.name === form.client)} />
            </Field>
            <Field label="Téléphone" hint="Renseigné automatiquement">
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+33 …" readOnly={!!clients.find(c => c.name === form.client)} />
            </Field>
            <Field label="Email" hint="Renseigné automatiquement">
              <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@…" readOnly={!!clients.find(c => c.name === form.client)} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Nom du client" required>
              <Input value={form.client} onChange={e => set("client", e.target.value)} placeholder="Nom de l'entreprise" />
            </Field>
            <Field label="Adresse" required>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Adresse complète de l'usine" />
            </Field>
            <Field label="Téléphone">
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+33 …" />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@entreprise.fr" />
            </Field>
          </>
        )}
      </div>
    );

    if (step === 1) return (
      <div>
        <Field label="Zone" required>
          <Select value={form.zone} onChange={e => handleZoneChange(e.target.value)} options={zones} placeholder={zones.length ? "Choisir une zone" : "Ajoutez une zone ci-dessous"} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Input value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="Nouvelle zone…" />
            <button onClick={addZone} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#0f172a", fontWeight: 800, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>+</button>
          </div>
        </Field>
        <Field label="Ligne de production" required>
          <Select value={form.ligne} onChange={e => handleLigneChange(e.target.value)} options={form.zone ? (lignes[form.zone] || []) : []} placeholder={form.zone ? (lignes[form.zone]?.length ? "Choisir une ligne" : "Ajoutez une ligne ci-dessous") : "Sélectionnez d'abord une zone"} />
          {form.zone && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Input value={newLigne} onChange={e => setNewLigne(e.target.value)} placeholder="Nouvelle ligne…" />
              <button onClick={addLigne} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#0f172a", fontWeight: 800, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>+</button>
            </div>
          )}
        </Field>
        <Field label="Machine" required>
          <Select value={form.machine} onChange={e => set("machine", e.target.value)} options={form.ligne ? (machines[form.ligne] || []) : []} placeholder={form.ligne ? (machines[form.ligne]?.length ? "Choisir une machine" : "Ajoutez une machine ci-dessous") : "Sélectionnez d'abord une ligne"} />
          {form.ligne && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Input value={newMachine} onChange={e => setNewMachine(e.target.value)} placeholder="Nouvelle machine…" />
              <button onClick={addMachine} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#0f172a", fontWeight: 800, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>+</button>
            </div>
          )}
        </Field>
        {form.zone && form.ligne && form.machine && (
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#f59e0b", textTransform: "uppercase", marginBottom: 6 }}>Arborescence</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
              {form.zone}<br />
              <span style={{ color: "#475569" }}>└ </span>{form.ligne}<br />
              <span style={{ color: "#475569" }}>  └ </span><span style={{ color: "#e2e8f0" }}>{form.machine}</span>
            </div>
          </div>
        )}
      </div>
    );

    if (step === 2) return (
      <div>
        <Field label="État général de la machine" required>
          <RadioGroup value={form.etatGeneral} onChange={v => set("etatGeneral", v)} options={[
            { value: "bon", label: "Bon", icon: "✅", activeColor: "#22c55e" },
            { value: "moyen", label: "Moyen", icon: "⚠️", activeColor: "#f59e0b" },
            { value: "mauvais", label: "Mauvais", icon: "❌", activeColor: "#ef4444" },
          ]} />
        </Field>
        <Field label="Statut de fonctionnement" required>
          <RadioGroup value={form.statut} onChange={v => set("statut", v)} options={[
            { value: "En service", label: "En service", icon: "🟢", activeColor: "#3b82f6" },
            { value: "Hors service", label: "Hors service", icon: "🔴", activeColor: "#6b7280" },
          ]} />
        </Field>
        <Field label="Anomalies constatées">
          <Textarea value={form.anomalies} onChange={e => set("anomalies", e.target.value)} placeholder="Décrire les anomalies observées : bruits, vibrations, fuites, défauts visuels…" rows={4} />
        </Field>
        <Field label="Observations & Remarques">
          <Textarea value={form.observations} onChange={e => set("observations", e.target.value)} placeholder="Commentaires libres du technicien, recommandations, actions à prévoir…" rows={3} />
        </Field>
      </div>
    );

    if (step === 3) return (
      <div>
        <Field label="Photos de documentation" hint="Prenez des photos ou importez depuis votre téléphone">
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button onClick={() => { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click(); }}
              style={{ flex: 1, padding: "14px", borderRadius: 10, border: "2px dashed #334155", background: "#1e293b", color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Icon d={ICONS.camera} size={24} color="#f59e0b" />
              <span style={{ fontWeight: 700, color: "#e2e8f0" }}>Appareil photo</span>
              <span style={{ fontSize: 11 }}>Prendre une photo</span>
            </button>
            <button onClick={() => { fileRef.current.removeAttribute("capture"); fileRef.current.click(); }}
              style={{ flex: 1, padding: "14px", borderRadius: 10, border: "2px dashed #334155", background: "#1e293b", color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Icon d={ICONS.upload} size={24} color="#3b82f6" />
              <span style={{ fontWeight: 700, color: "#e2e8f0" }}>Galerie</span>
              <span style={{ fontSize: 11 }}>Importer une image</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImage} style={{ display: "none" }} />
        </Field>

        {form.images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {form.images.map(img => (
              <div key={img.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #334155" }}>
                <img src={img.url} alt={img.name} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                <button onClick={() => removeImage(img.id)}
                  style={{ position: "absolute", top: 6, right: 6, background: "#ef444499", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={ICONS.close} size={12} color="white" />
                </button>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, #00000099)", padding: "20px 8px 6px", fontSize: 10, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</div>
              </div>
            ))}
          </div>
        )}

        {form.images.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px", color: "#475569", fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
            Aucune photo ajoutée
          </div>
        )}

        <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 12 }}>Récapitulatif</div>
          {[["Client", form.client], ["Machine", form.machine], ["Zone", form.zone], ["État", form.etatGeneral], ["Statut", form.statut], ["Photos", form.images.length + " image(s)"]].map(([k, v]) => v ? (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>{k}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
            </div>
          ) : null)}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={editingId ? handleUpdate : handleSave} disabled={saved}
            style={{ flex: 1, padding: "14px", borderRadius: 10, border: "none", background: saved ? "#1e293b" : editingId ? "#3b82f6" : "#f59e0b", color: saved ? "#94a3b8" : "#0f172a", fontWeight: 800, fontSize: 14, cursor: saved ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={saved ? ICONS.check : ICONS.save} size={18} color={saved ? "#94a3b8" : "#0f172a"} />
            {saved ? "Sauvegardé" : editingId ? "Modifier" : "Sauvegarder"}
          </button>
          <button onClick={() => handleExportPDF()}
            style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={ICONS.pdf} size={18} color="#3b82f6" /> PDF
          </button>
          <button onClick={() => handleSendEmail()}
            style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={ICONS.mail} size={18} color="#22c55e" /> Email
          </button>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const d = previewDiag;
    if (!d) return null;
    return (
      <div>
        <button onClick={() => { setView("history"); setPreviewDiag(null); }}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
          ← Retour à l'historique
        </button>
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#e2e8f0" }}>{d.client}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{d.date}</div>
          </div>
          {d.modifiedAt && <div style={{ background: "#f59e0b22", border: "1px solid #f59e0b44", borderRadius: 8, padding: "6px 12px", marginBottom: 12, fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>Rapport modifie le {d.modifiedAt}</div>}
          {[["Adresse", d.address], ["Téléphone", d.phone], ["Email", d.email]].map(([k, v]) => v ? (
            <div key={k} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}><span style={{ color: "#475569" }}>{k} : </span>{v}</div>
          ) : null)}
        </div>
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>Localisation</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{d.zone}<br /><span style={{ color: "#475569" }}>└ </span>{d.ligne}<br /><span style={{ color: "#475569" }}>  └ </span><span style={{ color: "#e2e8f0" }}>{d.machine}</span></div>
        </div>
        <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>Diagnostic</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {d.etatGeneral && <Badge text={d.etatGeneral} color={d.etatGeneral} />}
            {d.statut && <Badge text={d.statut} color={d.statut === "En service" ? "service" : "hors-service"} />}
          </div>
          {d.anomalies && <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, color: "#fca5a5", marginBottom: 8 }}><strong>Anomalies :</strong> {d.anomalies}</div>}
          {d.observations && <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, color: "#94a3b8" }}><strong>Observations :</strong> {d.observations}</div>}
        </div>
        {d.images?.length > 0 && (
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>Photos ({d.images.length})</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {d.images.map(img => <img key={img.id} src={img.url} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />)}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <button onClick={() => handleEditDiag(d)} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#93c5fd", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon d={ICONS.edit} size={16} color="#93c5fd" /> Modifier
          </button>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => handleExportPDF(d)} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#93c5fd", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon d={ICONS.pdf} size={16} color="#93c5fd" /> Exporter PDF
          </button>
          <button onClick={() => handleSendEmail(d)} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "#14532d", color: "#86efac", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon d={ICONS.mail} size={16} color="#86efac" /> Envoyer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>

        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderBottom: "1px solid #1e293b", padding: "20px 20px 16px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>DIAG<span style={{ color: "#f59e0b" }}>TECH</span></div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 1 }}>
                {view === "form" ? steps[step].label : view === "history" ? "Historique" : "Rapport"}
              </div>
            </div>
            <div style={{ background: "#1e293b", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#64748b" }}>
              {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {view === "form" && (
            <>
              <StepBar current={step} />
              {renderStep()}
              {step < 3 && (
                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  {step > 0 && (
                    <button onClick={() => { setStep(s => s - 1); setSaved(false); }}
                      style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontWeight: 700, cursor: "pointer" }}>
                      ← Retour
                    </button>
                  )}
                  <button onClick={() => {
                      if (step === 2 && (!form.etatGeneral || !form.statut)) {
                        showToast("Veuillez renseigner l'état général et le statut de fonctionnement", "error");
                        return;
                      }
                      setStep(s => s + 1); setSaved(false);
                    }}
                    style={{ flex: 2, padding: "14px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#0f172a", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                    Suivant →
                  </button>
                </div>
              )}
              {step === 3 && (
                <button onClick={() => { setStep(2); setSaved(false); }}
                  style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
                  ← Retour au diagnostic
                </button>
              )}
            </>
          )}

          {view === "history" && !previewDiag && (
            <>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{history.length} rapport{history.length > 1 ? "s" : ""} enregistré{history.length > 1 ? "s" : ""}</div>
              {history.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>Aucun diagnostic enregistré</div>}
              {history.map(d => (
                <HistoryCard key={d.id} diag={d}
                  onView={(d) => { setPreviewDiag(d); setView("preview"); }}
                  onEdit={handleEditDiag}
                  onDelete={async (id) => { await supabase.from("diagnostics").delete().eq("id", id); setHistory(h => h.filter(x => x.id !== id)); }} />
              ))}
            </>
          )}

          {view === "preview" && renderPreview()}
        </div>

        <div style={{ background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", position: "sticky", bottom: 0 }}>
          <button onClick={() => { setView("form"); setStep(0); setForm(INITIAL_FORM); setSaved(false); setEditingId(null); setManualClient(false); setNewZone(""); setNewLigne(""); setNewMachine(""); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", border: "none", background: "transparent", color: view === "form" ? "#f59e0b" : "#475569", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            <Icon d={ICONS.factory} size={20} color={view === "form" ? "#f59e0b" : "#475569"} />
            Nouveau
          </button>
          {navBtn(ICONS.history, "Historique", "history")}
        </div>

        {toast && (
          <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#14532d" : "#7f1d1d", color: toast.type === "success" ? "#86efac" : "#fca5a5", padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 8px 32px #00000066", border: `1px solid ${toast.type === "success" ? "#22c55e44" : "#ef444444"}` }}>
            {toast.type === "success" ? "✓ " : "⚠ "}{toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}
