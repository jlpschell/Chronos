// ============================================================================
// BouncerPreferences Component
// Configure notification filtering mode and contact lists
// ============================================================================

import { useCallback, useMemo, useState } from 'react';

import type { BouncerMode, Contact } from '../../types';
import { useUserStore } from '../../stores/user.store';

export function BouncerPreferences() {
  const {
    bouncerMode,
    emergencyContacts,
    vipContacts,
    setBouncerMode,
    addEmergencyContact,
    removeEmergencyContact,
    addVipContact,
    removeVipContact,
  } = useUserStore();

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [vipName, setVipName] = useState('');
  const [vipEmail, setVipEmail] = useState('');

  const safeMode = useMemo<BouncerMode>(() => bouncerMode ?? 'strict', [bouncerMode]);

  const handleModeChange = useCallback(
    (mode: BouncerMode) => {
      setBouncerMode(mode);
    },
    [setBouncerMode]
  );

  const handleAddEmergency = useCallback(() => {
    if (!emergencyName.trim()) return;
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: emergencyName.trim(),
      email: emergencyEmail.trim() || undefined,
    };
    addEmergencyContact(contact);
    setEmergencyName('');
    setEmergencyEmail('');
  }, [addEmergencyContact, emergencyEmail, emergencyName]);

  const handleAddVip = useCallback(() => {
    if (!vipName.trim()) return;
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: vipName.trim(),
      email: vipEmail.trim() || undefined,
    };
    addVipContact(contact);
    setVipName('');
    setVipEmail('');
  }, [addVipContact, vipEmail, vipName]);

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Bouncer Mode</h3>
          <p className="text-xs text-ink/60">
            Strict protects focus time. Fluid lets more through.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              safeMode === 'strict'
                ? 'bg-accent text-white'
                : 'bg-canvas hover:bg-ink/5'
            }`}
            onClick={() => handleModeChange('strict')}
          >
            Strict
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              safeMode === 'fluid'
                ? 'bg-accent text-white'
                : 'bg-canvas hover:bg-ink/5'
            }`}
            onClick={() => handleModeChange('fluid')}
          >
            Fluid
          </button>
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Emergency Contacts</h3>
          <p className="text-xs text-ink/60">
            These contacts always bypass the filter.
          </p>
        </div>
        <ContactForm
          name={emergencyName}
          email={emergencyEmail}
          onNameChange={setEmergencyName}
          onEmailChange={setEmergencyEmail}
          onSubmit={handleAddEmergency}
          submitLabel="Add emergency contact"
        />
        <ContactList
          items={emergencyContacts}
          onRemove={removeEmergencyContact}
          emptyLabel="No emergency contacts yet."
        />
      </div>

      {/* VIP contacts */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">VIP Contacts</h3>
          <p className="text-xs text-ink/60">
            VIPs get higher priority in fluid mode.
          </p>
        </div>
        <ContactForm
          name={vipName}
          email={vipEmail}
          onNameChange={setVipName}
          onEmailChange={setVipEmail}
          onSubmit={handleAddVip}
          submitLabel="Add VIP contact"
        />
        <ContactList
          items={vipContacts}
          onRemove={removeVipContact}
          emptyLabel="No VIP contacts yet."
        />
      </div>
    </div>
  );
}

interface ContactFormProps {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}

function ContactForm({
  name,
  email,
  onNameChange,
  onEmailChange,
  onSubmit,
  submitLabel,
}: ContactFormProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
      <label className="text-xs text-ink/60">
        Name
        <input
          className="mt-1 w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-ink"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Name"
        />
      </label>
      <label className="text-xs text-ink/60">
        Email (optional)
        <input
          className="mt-1 w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-ink"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="email@example.com"
        />
      </label>
      <button
        type="button"
        className="px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
        onClick={onSubmit}
        disabled={!name.trim()}
      >
        {submitLabel}
      </button>
    </div>
  );
}

interface ContactListProps {
  items: Contact[];
  onRemove: (id: string) => void;
  emptyLabel: string;
}

function ContactList({ items, onRemove, emptyLabel }: ContactListProps) {
  if (items.length === 0) {
    return <div className="text-xs text-ink/50">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center justify-between rounded border border-border bg-canvas px-3 py-2 text-sm"
        >
          <div>
            <div className="font-medium">{contact.name}</div>
            {contact.email && (
              <div className="text-xs text-ink/60">{contact.email}</div>
            )}
          </div>
          <button
            type="button"
            className="text-xs text-ink/40 hover:text-red-500"
            onClick={() => onRemove(contact.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
