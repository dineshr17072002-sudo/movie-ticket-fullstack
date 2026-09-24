import { useState, useEffect, createContext, useContext } from "react";

const API = "http://localhost:8080/api";
const GENRES = ["Action","Comedy","Drama","Horror","Sci-Fi","Romance","Thriller","Animation","Documentary"];
const EMPTY_MOVIE = { title:"", genre:"", director:"", releaseYear:"", description:"", rating:"" };

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("movie_user")); }
    catch { return null; }
  });
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("movie_user", JSON.stringify(userData));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("movie_user");
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div style={st.toast}>{msg}</div>;
}

function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div style={st.overlay} onClick={onClose}>
      <div style={st.modal} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function StarRating({ value }) {
  const filled = Math.round(value / 2);
  return (
    <span>
      <span style={{ color: "#f5c518" }}>{"★".repeat(filled)}{"☆".repeat(5 - filled)}</span>
      <span style={{ color: "#888", fontSize: 12, marginLeft: 4 }}>{value}/10</span>
    </span>
  );
}

function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (f) => (e) => {
    setForm(v => ({ ...v, [f]: e.target.value }));
    setErrors(v => ({ ...v, [f]: "" }));
    setApiErr("");
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    return e;
  };

  const handleLogin = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiErr("");
    try {
      const res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid email or password.");
      }
      const data = await res.json();
      login(data);
    } catch (err) {
      if (err.message.includes("fetch") || err.message.includes("Failed")) {
        login({ id: 1, name: form.email.split("@")[0], email: form.email });
      } else {
        setApiErr(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={st.authBg}>
      <div style={st.filmLeft} /><div style={st.filmRight} />
      <div style={st.authCard}>
        <div style={st.authIcon}>🎬</div>
        <div style={st.authBrand}>CineVault</div>
        <div style={st.authTagline}>Sign in to your movie vault</div>
        {apiErr && <div style={st.apiErr}>⚠️ {apiErr}</div>}
        <div style={st.authForm}>
          <div style={st.fg}>
            <label style={st.label}>Email</label>
            <input style={{ ...st.input, ...(errors.email ? st.inputErr : {}) }}
              type="email" placeholder="you@example.com"
              value={form.email} onChange={set("email")}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
            {errors.email && <span style={st.fieldErr}>{errors.email}</span>}
          </div>
          <div style={st.fg}>
            <label style={st.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...st.input, ...(errors.password ? st.inputErr : {}), paddingRight: 44 }}
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button style={st.eyeBtn} onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <span style={st.fieldErr}>{errors.password}</span>}
          </div>
          <button style={{ ...st.authBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
          <div style={st.switchRow}>
            <span style={{ color: "#888" }}>No account? </span>
            <span style={st.switchLink} onClick={onSwitch}>Register free</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (f) => (e) => {
    setForm(v => ({ ...v, [f]: e.target.value }));
    setErrors(v => ({ ...v, [f]: "" }));
    setApiErr("");
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "At least 6 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords don't match.";
    return e;
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthColors = ["","#e74c3c","#e67e22","#f5c518","#2ecc71","#27ae60"];
  const strengthLabels = ["","Weak","Fair","Good","Strong","Very strong"];

  const handleRegister = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiErr("");
    try {
      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed.");
      }
      const data = await res.json();
      login(data);
    } catch (err) {
      if (err.message.includes("fetch") || err.message.includes("Failed")) {
        login({ id: Date.now(), name: form.name, email: form.email });
      } else {
        setApiErr(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={st.authBg}>
      <div style={st.filmLeft} /><div style={st.filmRight} />
      <div style={st.authCard}>
        <div style={st.authIcon}>🎬</div>
        <div style={st.authBrand}>CineVault</div>
        <div style={st.authTagline}>Create your free account</div>
        {apiErr && <div style={st.apiErr}>⚠️ {apiErr}</div>}
        <div style={st.authForm}>
          <div style={st.fg}>
            <label style={st.label}>Full Name</label>
            <input style={{ ...st.input, ...(errors.name ? st.inputErr : {}) }}
              placeholder="Jane Doe" value={form.name} onChange={set("name")}
              onKeyDown={e => e.key === "Enter" && handleRegister()} />
            {errors.name && <span style={st.fieldErr}>{errors.name}</span>}
          </div>
          <div style={st.fg}>
            <label style={st.label}>Email</label>
            <input style={{ ...st.input, ...(errors.email ? st.inputErr : {}) }}
              type="email" placeholder="you@example.com" value={form.email} onChange={set("email")}
              onKeyDown={e => e.key === "Enter" && handleRegister()} />
            {errors.email && <span style={st.fieldErr}>{errors.email}</span>}
          </div>
          <div style={st.fg}>
            <label style={st.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...st.input, ...(errors.password ? st.inputErr : {}), paddingRight: 44 }}
                type={showPwd ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password} onChange={set("password")}
                onKeyDown={e => e.key === "Enter" && handleRegister()}
              />
              <button style={st.eyeBtn} onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <span style={st.fieldErr}>{errors.password}</span>}
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex:1, height:3, borderRadius:2,
                      background: i <= strength ? strengthColors[strength] : "#2a2a4a",
                      transition:"background .3s" }} />
                  ))}
                </div>
                <div style={{ fontSize:11, color:strengthColors[strength], marginTop:3 }}>
                  {strengthLabels[strength]}
                </div>
              </div>
            )}
          </div>
          <div style={st.fg}>
            <label style={st.label}>Confirm Password</label>
            <input style={{ ...st.input, ...(errors.confirm ? st.inputErr : {}) }}
              type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")}
              onKeyDown={e => e.key === "Enter" && handleRegister()} />
            {errors.confirm && <span style={st.fieldErr}>{errors.confirm}</span>}
          </div>
          <button style={{ ...st.authBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleRegister} disabled={loading}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
          <div style={st.switchRow}>
            <span style={{ color: "#888" }}>Already have an account? </span>
            <span style={st.switchLink} onClick={onSwitch}>Sign in</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPages() {
  const [page, setPage] = useState("login");
  return page === "login"
    ? <LoginPage onSwitch={() => setPage("register")} />
    : <RegisterPage onSwitch={() => setPage("login")} />;
}

function MovieCard({ movie, onEdit, onDelete, onBook }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={st.card}>
      <div style={st.badge}>{movie.genre}</div>
      <div style={st.cardTitle}>{movie.title}</div>
      <div style={st.cardMeta}>
        <span>🎬 {movie.director}</span>
        <span>📅 {movie.releaseYear}</span>
      </div>
      {movie.rating && <div style={{ marginTop:6 }}><StarRating value={movie.rating} /></div>}
      {movie.description && (
        <div style={st.cardDesc}>
          {expanded ? movie.description : movie.description.slice(0,90) + (movie.description.length > 90 ? "…" : "")}
          {movie.description.length > 90 &&
            <span style={st.readMore} onClick={() => setExpanded(!expanded)}>
              {expanded ? " less" : " more"}
            </span>}
        </div>
      )}
      <div style={st.cardBtns}>
        <button
    style={st.editBtn}
    onClick={() => onEdit(movie)}
>
    ✏️ Edit
</button>

<button
    style={st.delBtn}
    onClick={() => onDelete(movie.id)}
>
    🗑️ Delete
</button>

<button
    style={st.authBtn}
    onClick={() => onBook(movie)}
>
    🎟 Book Ticket
</button>
      </div>
    </div>
  );
}

function MovieForm({ form, onChange, onSubmit, onCancel, isEdit, error }) {
  const ch = (f) => (e) => onChange(f, e.target.value);
  return (
    <div>
      <h2 style={st.modalTitle}>{isEdit ? "✏️ Edit Movie" : "🎬 Register Movie"}</h2>
      {error && <div style={st.apiErr}>{error}</div>}
      <div style={st.formGrid}>
        <div style={st.fg}>
          <label style={st.label}>Title *</label>
          <input style={st.input} placeholder="e.g. Inception" value={form.title} onChange={ch("title")} />
        </div>
        <div style={st.fg}>
          <label style={st.label}>Director *</label>
          <input style={st.input} placeholder="e.g. Christopher Nolan" value={form.director} onChange={ch("director")} />
        </div>
        <div style={st.fg}>
          <label style={st.label}>Genre *</label>
          <select style={st.input} value={form.genre} onChange={ch("genre")}>
            <option value="">Select genre</option>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div style={st.fg}>
          <label style={st.label}>Release Year *</label>
          <input style={st.input} type="number" placeholder="e.g. 2010" value={form.releaseYear} onChange={ch("releaseYear")} />
        </div>
        <div style={st.fg}>
          <label style={st.label}>Rating (0–10)</label>
          <input style={st.input} type="number" step="0.1" min="0" max="10" placeholder="e.g. 8.8" value={form.rating} onChange={ch("rating")} />
        </div>
      </div>
      <div style={st.fg}>
        <label style={st.label}>Description</label>
        <textarea style={{ ...st.input, height:80, resize:"vertical" }}
          placeholder="Brief synopsis…" value={form.description} onChange={ch("description")} />
      </div>
      <div style={{ display:"flex", gap:10, marginTop:18 }}>
        <button style={st.authBtn} onClick={onSubmit}>{isEdit ? "Update Movie" : "Register Movie"}</button>
        <button style={st.cancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

const DEMO = [
  { id:1, title:"Inception", genre:"Sci-Fi", director:"Christopher Nolan", releaseYear:2010, rating:8.8, description:"A thief who steals corporate secrets through dream-sharing technology." },
  { id:2, title:"The Dark Knight", genre:"Action", director:"Christopher Nolan", releaseYear:2008, rating:9.0, description:"Batman faces the Joker in a gripping battle for Gotham's soul." },
  { id:3, title:"Parasite", genre:"Thriller", director:"Bong Joon-ho", releaseYear:2019, rating:8.5, description:"Greed and class discrimination threaten a symbiotic relationship between two families." },
];

function Dashboard() {
  const { user, logout } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_MOVIE);
  const [editId, setEditId] = useState(null);
  const [formErr, setFormErr] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

const [selectedMovie, setSelectedMovie] = useState(null);

const [booking, setBooking] = useState({
    customerName: "",
    email: "",
    seats: 1
});

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const url = search.trim()
        ? `${API}/movies/search?title=${encodeURIComponent(search)}`
        : `${API}/movies`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setMovies(await res.json());
    } catch { setMovies(DEMO); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMovies(); }, []);

  const handleSubmit = async () => {
    if (!form.title.trim())    { setFormErr("Title is required.");        return; }
    if (!form.genre)           { setFormErr("Genre is required.");        return; }
    if (!form.director.trim()) { setFormErr("Director is required.");     return; }
    if (!form.releaseYear)     { setFormErr("Release year is required."); return; }
    const payload = { ...form, releaseYear: parseInt(form.releaseYear), rating: form.rating ? parseFloat(form.rating) : null };
    try {
  const url = editId
    ? `${API}/movies/${editId}`
    : `${API}/movies`;

  const res = await fetch(url, {
    method: editId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error();

  notify(editId ? "✅ Movie updated!" : "✅ Movie registered!");
  setShowForm(false);
  setEditId(null);
  setForm(EMPTY_MOVIE);
  fetchMovies();
} catch {
  if (editId) {
    setMovies(ms =>
      ms.map(m => (m.id === editId ? { ...payload, id: editId } : m))
    );
  } else {
    setMovies(ms => [...ms, { ...payload, id: Date.now() }]);
  }

  notify(editId ? "✅ Movie updated!" : "✅ Movie registered!");
  setShowForm(false);
  setEditId(null);
  setForm(EMPTY_MOVIE);
}
  };
  const handleDelete = async (id) => {
    try { await fetch(`${API}/movies/${id}`, { method:"DELETE" }); } catch {}
    setMovies(ms => ms.filter(m => m.id !== id));
    notify("🗑️ Movie deleted."); setConfirmDel(null);
  };

const handleEdit = (movie) => {
    setForm({
        title: movie.title,
        genre: movie.genre,
        director: movie.director,
        releaseYear: movie.releaseYear,
        description: movie.description || "",
        rating: movie.rating ?? ""
    });

    setEditId(movie.id);
    setFormErr("");
    setShowForm(true);
};

const handleBook = (movie) => {
    setSelectedMovie(movie);
    setShowBooking(true);
};

  const filtered = movies.filter(m =>
    (!filterGenre || m.genre === filterGenre) &&
    (!search.trim() || m.title.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: movies.length,
    genres: [...new Set(movies.map(m => m.genre))].length,
    avg: movies.filter(m => m.rating).length
      ? (movies.filter(m => m.rating).reduce((a,m) => a+m.rating,0) / movies.filter(m => m.rating).length).toFixed(1)
      : "—",
  };

  return (
    <div style={st.appBg}>
      <header style={st.header}>
        <div style={st.headerInner}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:30 }}>🎬</span>
            <div>
              <div style={st.brand}>CineVault</div>
              <div style={st.brandSub}>Your personal movie registry</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button style={st.addBtn}
              onClick={() => { setForm(EMPTY_MOVIE); setEditId(null); setFormErr(""); setShowForm(true); }}>
              + Register Movie
            </button>
            <div style={st.userChip} onClick={() => setShowLogout(true)}>
              <div style={st.avatar}>{(user?.name||"U")[0].toUpperCase()}</div>
              <span style={{ fontSize:13, color:"#ccc" }}>{user?.name||user?.email}</span>
              <span style={{ color:"#666", fontSize:11 }}>▾</span>
            </div>
          </div>
        </div>
      </header>

      <div style={st.statsBar}>
        <div style={st.statsInner}>
          {[["🎬",stats.total,"Movies"],["🎭",stats.genres,"Genres"],["⭐",stats.avg,"Avg Rating"]].map(([icon,val,lbl]) => (
            <div key={lbl} style={st.statItem}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={st.statVal}>{val}</span>
              <span style={st.statLbl}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={st.toolbar}>
        <div style={st.searchBox}>
        <span>🔍</span>
        <input style={st.searchInp} placeholder="Search by title…"
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key==="Enter" && fetchMovies()} />
        </div>
        <select style={st.filterSel} value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
          <option value="">All genres</option>
          {GENRES.map(g => <option key={g}>{g}</option>)}
        </select>
        <span style={{ fontSize:13, color:"#666", marginLeft:"auto" }}>
          {filtered.length} film{filtered.length!==1?"s":""}
        </span>
      </div>

      <main style={st.main}>
        {loading ? (
          <div style={st.empty}>⏳ Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={st.empty}>
            <div style={{ fontSize:52 }}>🎭</div>
            <div style={{ marginTop:12 }}>No movies found. Register your first one!</div>
          </div>
        ) : (
          <div style={st.grid}>
            {filtered.map(m => <MovieCard
    key={m.id}
    movie={m}
    onEdit={handleEdit}
    onDelete={id => setConfirmDel(id)}
    onBook={handleBook}
/>)}
          </div>
        )}
      </main>

      <Modal show={showForm} onClose={() => setShowForm(false)}>
        <MovieForm form={form}
          onChange={(f,v) => { setForm(fm => ({...fm,[f]:v})); setFormErr(""); }}
          onSubmit={handleSubmit} onCancel={() => setShowForm(false)}
          isEdit={!!editId} error={formErr} />
      </Modal>

      <Modal show={!!confirmDel} onClose={() => setConfirmDel(null)}>
        <div style={{ textAlign:"center", padding:"8px 0" }}>
          <div style={{ fontSize:44 }}>🗑️</div>
          <h3 style={{ color:"#fff", margin:"14px 0 8px" }}>Delete this movie?</h3>
          <p style={{ color:"#888", fontSize:14, marginBottom:22 }}>This cannot be undone.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <button style={{ ...st.delBtn, padding:"10px 28px", flex:"none" }} onClick={() => handleDelete(confirmDel)}>Delete</button>
            <button style={st.cancelBtn} onClick={() => setConfirmDel(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal show={showLogout} onClose={() => setShowLogout(false)}>
        <div style={{ textAlign:"center", padding:"8px 0" }}>
          <div style={{ fontSize:44 }}>👋</div>
          <h3 style={{ color:"#fff", margin:"14px 0 8px" }}>Sign out?</h3>
          <p style={{ color:"#888", fontSize:14, marginBottom:22 }}>You'll need to sign in again.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <button style={st.authBtn} onClick={logout}>Sign Out</button>
            <button style={st.cancelBtn} onClick={() => setShowLogout(false)}>Stay</button>
          </div>
        </div>
      </Modal>

      <Toast msg={toast} />
    </div>
  );
}

function Inner() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Dashboard /> : <AuthPages />;
}

export default function App() {
  return <AuthProvider><Inner /></AuthProvider>;
}

const st = {
  authBg: { minHeight:"100vh", background:"#0a0a14", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", fontFamily:"'Segoe UI', sans-serif" },
  filmLeft: { position:"absolute", top:0, left:-50, width:100, height:"100%", background:"repeating-linear-gradient(180deg,#1a1a2e 0,#1a1a2e 55px,#0a0a14 55px,#0a0a14 75px)", opacity:.35 },
  filmRight: { position:"absolute", top:0, right:-50, width:100, height:"100%", background:"repeating-linear-gradient(180deg,#1a1a2e 0,#1a1a2e 55px,#0a0a14 55px,#0a0a14 75px)", opacity:.35 },
  authCard: { background:"#13132a", border:"1px solid #2a2a50", borderRadius:20, padding:"38px 34px", width:"100%", maxWidth:420, position:"relative", zIndex:1, boxShadow:"0 24px 80px #000b" },
  authIcon: { textAlign:"center", fontSize:40 },
  authBrand: { textAlign:"center", fontSize:26, fontWeight:900, color:"#f5c518", letterSpacing:2, marginTop:4 },
  authTagline: { textAlign:"center", color:"#888", fontSize:13, margin:"6px 0 24px" },
  authForm: { display:"flex", flexDirection:"column", gap:14 },
  authBtn: { width:"100%", padding:"12px 0", background:"#f5c518", color:"#0a0a14", border:"none", borderRadius:9, fontWeight:800, fontSize:15, cursor:"pointer", marginTop:4 },
  switchRow: { textAlign:"center", fontSize:13 },
  switchLink: { color:"#f5c518", cursor:"pointer", fontWeight:700 },
  apiErr: { background:"#c0392b22", border:"1px solid #c0392b55", color:"#e74c3c", borderRadius:9, padding:"10px 14px", fontSize:13, marginBottom:4 },
  eyeBtn: { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16 },
  fg: { display:"flex", flexDirection:"column" },
  label: { fontSize:11, fontWeight:700, color:"#aaa", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 },
  input: { padding:"10px 12px", background:"#0a0a14", border:"1px solid #2a2a50", borderRadius:9, color:"#eee", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" },
  inputErr: { borderColor:"#e74c3c" },
  fieldErr: { color:"#e74c3c", fontSize:12, marginTop:4 },
  appBg: { minHeight:"100vh", background:"#0f0f1a", fontFamily:"'Segoe UI', sans-serif", color:"#eee" },
  header: { background:"linear-gradient(135deg,#1a1a2e,#16213e)", borderBottom:"1px solid #f5c51820", padding:"16px 0" },
  headerInner: { maxWidth:1140, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  brand: { fontSize:22, fontWeight:900, color:"#f5c518", letterSpacing:1 },
  brandSub: { fontSize:12, color:"#888", marginTop:1 },
  addBtn: { background:"#f5c518", color:"#0f0f1a", border:"none", borderRadius:9, padding:"10px 18px", fontWeight:800, fontSize:13, cursor:"pointer" },
  userChip: { display:"flex", alignItems:"center", gap:8, background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:30, padding:"7px 14px", cursor:"pointer" },
  avatar: { width:28, height:28, borderRadius:"50%", background:"#f5c518", color:"#0f0f1a", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13 },
  statsBar: { background:"#13132a", borderBottom:"1px solid #2a2a4a" },
  statsInner: { maxWidth:1140, margin:"0 auto", padding:"14px 24px", display:"flex", gap:36 },
  statItem: { display:"flex", alignItems:"center", gap:8 },
  statVal: { fontSize:20, fontWeight:900, color:"#f5c518" },
  statLbl: { fontSize:12, color:"#888" },
  toolbar: { maxWidth:1140, margin:"20px auto 0", padding:"0 24px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" },
  searchBox: { flex:1, minWidth:200, display:"flex", alignItems:"center", gap:8, background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:9, padding:"0 12px" },
  searchInp: { flex:1, background:"transparent", border:"none", outline:"none", color:"#eee", fontSize:14, padding:"10px 0" },
  filterSel: { padding:"10px 12px", background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:9, color:"#eee", fontSize:14, cursor:"pointer" },
  main: { maxWidth:1140, margin:"24px auto", padding:"0 24px 48px" },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 },
  empty: { textAlign:"center", color:"#666", padding:"72px 0", fontSize:15 },
  card: { background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:14, padding:20 },
  badge: { display:"inline-block", background:"#f5c51820", color:"#f5c518", border:"1px solid #f5c51840", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 },
  cardTitle: { fontSize:17, fontWeight:800, color:"#fff", marginBottom:8, lineHeight:1.3 },
  cardMeta: { display:"flex", flexDirection:"column", gap:4, fontSize:13, color:"#aaa" },
  cardDesc: { fontSize:13, color:"#999", marginTop:10, lineHeight:1.5 },
  readMore: { color:"#f5c518", cursor:"pointer", fontWeight:600 },
  cardBtns: { display:"flex", gap:8, marginTop:14 },
  editBtn: { flex:1, padding:"7px 0", background:"#16213e", border:"1px solid #2a2a4a", borderRadius:7, color:"#eee", cursor:"pointer", fontSize:13, fontWeight:600 },
  delBtn: { flex:1, padding:"7px 0", background:"#c0392b22", border:"1px solid #c0392b44", borderRadius:7, color:"#e74c3c", cursor:"pointer", fontSize:13, fontWeight:600 },
  overlay: { position:"fixed", inset:0, background:"#000000aa", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modal: { background:"#13132a", border:"1px solid #2a2a4a", borderRadius:18, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" },
  modalTitle: { margin:"0 0 20px", color:"#f5c518", fontSize:19, fontWeight:800 },
  formGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" },
  cancelBtn: { padding:"11px 20px", background:"transparent", color:"#aaa", border:"1px solid #333", borderRadius:8, cursor:"pointer", fontSize:14 },
  toast: { position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:"#f5c518", color:"#0f0f1a", padding:"12px 26px", borderRadius:30, fontWeight:800, fontSize:14, zIndex:200, boxShadow:"0 4px 24px #0009", whiteSpace:"nowrap" },
};