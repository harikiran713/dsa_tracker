'use client';

import { HrContact, emptyHrContact } from '@/lib/hr-contacts';
import { Users, Plus, Trash2, Download } from 'lucide-react';

interface HrContactsPanelProps {
  userId: string;
  contacts: HrContact[];
  onContactsChange: (contacts: HrContact[]) => void;
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function downloadAsExcel(contacts: HrContact[]) {
  const headers = ['Name', 'LinkedIn', 'Phone Numbers', 'Emails', 'Role', 'Company'];
  const lines = [
    headers.join(','),
    ...contacts.map((c) =>
      [c.name, c.linkedin, c.phones.join('; '), c.emails.join('; '), c.role, c.company]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hr-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function HrContactsPanel({ userId, contacts, onContactsChange }: HrContactsPanelProps) {
  const update = (id: string, patch: Partial<HrContact>) => {
    onContactsChange(
      contacts.map((c) =>
        c.id === id ? { ...c, ...patch, updated_at: new Date().toISOString() } : c
      )
    );
  };

  const addRow = () => {
    onContactsChange([...contacts, emptyHrContact(userId)]);
  };

  const deleteRow = (id: string) => {
    onContactsChange(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="hr-contacts-panel">
      <div className="glass-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(129,140,248,0.14)', border: '1px solid rgba(129,140,248,0.30)' }}
            >
              <Users className="w-5 h-5" style={{ color: '#818CF8' }} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">HR Contacts</h2>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Private to your account only — track HR name, LinkedIn, phone(s), email(s), role, company.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={addRow} className="btn btn-sm btn-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add row
            </button>
            <button
              type="button"
              onClick={() => downloadAsExcel(contacts)}
              disabled={contacts.length === 0}
              className="btn btn-sm btn-secondary flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-3 overflow-x-auto">
        <table className="hr-contacts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>LinkedIn</th>
              <th>Phone number(s)</th>
              <th>Email(s)</th>
              <th>Role</th>
              <th>Company</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => update(c.id, { name: e.target.value })}
                    placeholder="Name"
                    className="hr-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={c.linkedin}
                    onChange={(e) => update(c.id, { linkedin: e.target.value })}
                    placeholder="linkedin.com/in/…"
                    className="hr-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={c.phones.join(', ')}
                    onChange={(e) => update(c.id, { phones: parseList(e.target.value) })}
                    placeholder="+91 9xxxxxxxxx, +91 8xxxxxxxxx"
                    className="hr-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={c.emails.join(', ')}
                    onChange={(e) => update(c.id, { emails: parseList(e.target.value) })}
                    placeholder="a@x.com, b@y.com"
                    className="hr-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={c.role}
                    onChange={(e) => update(c.id, { role: e.target.value })}
                    placeholder="HR Recruiter"
                    className="hr-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={c.company}
                    onChange={(e) => update(c.id, { company: e.target.value })}
                    placeholder="Company"
                    className="hr-cell-input"
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => deleteRow(c.id)}
                    className="goal-note-action-btn"
                    aria-label="Delete row"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={7} className="hr-empty-row">
                  No HR contacts yet — click &ldquo;Add row&rdquo; to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
