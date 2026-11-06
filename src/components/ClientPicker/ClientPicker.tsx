import React, { useState } from 'react';
import './ClientPicker.css';
import { Client } from '../../types/session';
import { addClient } from '../../utils/sessionStore';

// Picks whose sessions get saved. Optional: with no client selected the tools
// work as usual and nothing is saved. Deliberately not remembered across
// reloads, so one client's data can't land under the last client used.

interface ClientPickerProps {
  clients: Client[];
  activeClientId: string | null;
  onSelect: (clientId: string | null) => void;
  onClientAdded: (client: Client) => void;
}

const ClientPicker: React.FC<ClientPickerProps> = ({ clients, activeClientId, onSelect, onClientAdded }) => {
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = addClient(code);
    if (!client) {
      setError('Enter a code that isn\'t already used.');
      return;
    }
    onClientAdded(client);
    setCode('');
    setError('');
    setAdding(false);
  };

  return (
    <div className="client-picker">
      <label>
        👤 Client:{' '}
        <select
          value={activeClientId ?? ''}
          onChange={e => onSelect(e.target.value || null)}
        >
          <option value="">None (not saved)</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
      </label>
      {!adding && <button type="button" onClick={() => setAdding(true)}>➕ New Client</button>}
      {adding && (
        <form onSubmit={submit} className="client-add-form">
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Code, like A1"
            maxLength={12}
            aria-label="Client code"
            autoFocus
          />
          <button type="submit">Add</button>
          <button type="button" onClick={() => { setAdding(false); setError(''); }}>Cancel</button>
          <p className="client-note">Use a code, not a name or initials. Data stays on this device.</p>
          {error && <p className="client-error">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default ClientPicker;
