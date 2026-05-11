const { useState, useEffect } = React;

function avgScore(snack) {
  return (snack.ben.score + snack.janna.score) / 2;
}

function PhotoImg({ snack }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <svg className="sn-card-photo" viewBox="0 0 400 300" preserveAspectRatio="none">
        <rect width="400" height="300" fill="var(--tan)" />
        <text x="200" y="158" textAnchor="middle" fontFamily="var(--mono)"
              fontSize="13" fill="rgba(247,247,239,0.7)" letterSpacing="2">NO PHOTO</text>
      </svg>
    );
  }
  return (
    <img
      className="sn-card-photo"
      src={`media/snacks/${snack.photo}`}
      alt={snack.name}
      onError={() => setErrored(true)}
    />
  );
}

function SnackCard({ snack }) {
  const avg = avgScore(snack);
  return (
    <div className="sn-card">
      <PhotoImg snack={snack} />
      <div className="sn-card-body">
        <div className="sn-card-name">{snack.name}</div>
        <div className="sn-card-country">{snack.country}</div>
        <div className="sn-card-scores">
          <div className="sn-score-row">
            <div className="sn-score-badge">{snack.ben.score}/10</div>
            <div className="sn-score-who">Ben</div>
            <div className="sn-score-note">{snack.ben.note}</div>
          </div>
          <div className="sn-score-row">
            <div className="sn-score-badge">{snack.janna.score}/10</div>
            <div className="sn-score-who">Janna</div>
            <div className="sn-score-note">{snack.janna.note}</div>
          </div>
        </div>
        <div className="sn-card-avg">
          <div className="sn-avg-label">Joint score</div>
          <div className="sn-avg-score">{avg.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}

function SnackGallery() {
  const [snacks, setSnacks] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('snacks.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const sorted = [...data].sort((a, b) => avgScore(b) - avgScore(a));
        setSnacks(sorted);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="sn-loading">Could not load snacks.json</div>;
  if (!snacks) return <div className="sn-loading">Loading…</div>;

  return (
    <main className="sn-page">
      <div className="sn-page-title">Rated {snacks.length} trail snacks</div>
      <div className="sn-grid">
        {snacks.map(s => <SnackCard key={s.id} snack={s} />)}
      </div>
    </main>
  );
}

function App() {
  return (
    <div>
      <header className="sn-header">
        <div>
          <div className="sn-brand-title">WANDERLOG</div>
          <div className="sn-brand-sub">Trail snack ratings — Ben &amp; Janna</div>
        </div>
        <a href="index.html" className="sn-nav-link">
          <span aria-hidden>←</span> Map
        </a>
      </header>
      <SnackGallery />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
