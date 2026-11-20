const ATTACK = ['Politique', 'Journalistes', 'Clients', 'Salariés'];
const DEFENSE = ['PDG', 'Communicant', 'RH', 'Responsable des OP'];

export default function RolesPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`panel roles-panel${compact ? ' roles-compact' : ''}`}>
      <h2 className="roles-title">⚔️ ATTAQUE <span className="roles-vs-word">vs</span> DÉFENSE 🛡️</h2>
      <div className="roles-face">
        <div className="roles-col roles-attack">
          <h3>⚔️ Attaque</h3>
          {ATTACK.map((r) => <div key={r} className="roles-item">{r}</div>)}
        </div>
        <div className="roles-vs">VS</div>
        <div className="roles-col roles-defense">
          <h3>Défense 🛡️</h3>
          {DEFENSE.map((r) => <div key={r} className="roles-item">{r}</div>)}
        </div>
      </div>
      <p className="roles-note">À chaque tour, une équipe reçoit les rôles d'attaque, l'autre ceux de défense — alternance de parole attaque / défense.</p>
    </section>
  );
}
