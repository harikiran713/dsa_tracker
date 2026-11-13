'use client';

import { useMemo, useState } from 'react';
import { HrContact, emptyHrContact } from '@/lib/hr-contacts';
import { Users, Plus, Trash2, Download, ExternalLink, Search, X } from 'lucide-react';

interface HrContactsPanelProps {
  userId: string;
  contacts: HrContact[];
  onContactsChange: (contacts: HrContact[]) => void;
}

type ListField = 'phones' | 'emails';

/** Adds a protocol so a bare "linkedin.com/in/xyz" paste still opens correctly. */
function normalizeLinkedinUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function downloadAsExcel(contacts: HrContact[]) {
  const headers = ['Name', 'LinkedIn', 'Phone Numbers', 'Emails', 'Role', 'Company'];
  const lines = [
    headers.join(','),
    ...contacts.map((c) =>
      [
        c.name,
        c.linkedin,
        c.phones.filter(Boolean).join('; '),
        c.emails.filter(Boolean).join('; '),
        c.role,
        c.company,
      ]
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

const ALL = 'all';

export function HrContactsPanel({ userId, contacts, onContactsChange }: HrContactsPanelProps) {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState(ALL);
  const [roleFilter, setRoleFilter] = useState(ALL);

  const companyOptions = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.company.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [contacts]
  );
  const roleOptions = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.role.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (companyFilter !== ALL && c.company !== companyFilter) return false;
      if (roleFilter !== ALL && c.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = [
        c.name,
        c.company,
        c.role,
        c.linkedin,
        c.phones.filter(Boolean).join(' '),
        c.emails.filter(Boolean).join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [contacts, search, companyFilter, roleFilter]);

  const isFiltered = search.trim() !== '' || companyFilter !== ALL || roleFilter !== ALL;

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

  const setListItem = (id: string, field: ListField, idx: number, value: string) => {
    const current = contacts.find((c) => c.id === id);
    if (!current) return;
    const list = current[field].length ? [...current[field]] : [''];
    list[idx] = value;
    update(id, { [field]: list });
  };

  const addListItem = (id: string, field: ListField) => {
    const current = contacts.find((c) => c.id === id);
    if (!current) return;
    const list = current[field].length ? [...current[field]] : [''];
    update(id, { [field]: [...list, ''] });
  };

  const removeListItem = (id: string, field: ListField, idx: number) => {
    const current = contacts.find((c) => c.id === id);
    if (!current) return;
    const list = current[field].filter((_, i) => i !== idx);
    update(id, { [field]: list });
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

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <Search
              className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2"
              style={{ left: 12, color: '#64748B' }}
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, role, LinkedIn, phone, email…"
              className="glass-input w-full py-2 text-sm"
              style={{ borderRadius: 12, padding: '8px 14px 8px 34px' }}
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="glass-input text-sm py-1.5 px-3 rounded-full"
            style={{ maxWidth: 200 }}
            aria-label="Filter by company"
          >
            <option value={ALL}>All companies</option>
            {companyOptions.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="glass-input text-sm py-1.5 px-3 rounded-full"
            style={{ maxWidth: 200 }}
            aria-label="Filter by role"
          >
            <option value={ALL}>All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {isFiltered && (
          <p className="text-xs mt-3" style={{ color: '#94A3B8' }}>
            Showing <strong className="text-white tabular-nums">{filteredContacts.length}</strong> of {contacts.length} contacts
          </p>
        )}
      </div>

      <div className="glass-panel p-3 overflow-x-auto">
        <table className="hr-contacts-table">
          <colgroup>
            <col style={{ width: 180 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 220 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 48 }} />
          </colgroup>
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
            {filteredContacts.map((c) => (
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
                  <div className="hr-linkedin-cell">
                    <input
                      type="text"
                      value={c.linkedin}
                      onChange={(e) => update(c.id, { linkedin: e.target.value })}
                      placeholder="linkedin.com/in/…"
                      className="hr-cell-input"
                    />
                    {c.linkedin.trim() && (
                      <a
                        href={normalizeLinkedinUrl(c.linkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="goal-note-action-btn"
                        aria-label="Open LinkedIn profile"
                        title="Open LinkedIn profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                      </a>
                    )}
                  </div>
                </td>
                <td>
                  <div className="hr-multi-cell">
                    {(c.phones.length ? c.phones : ['']).map((phone, idx) => (
                      <div key={idx} className="hr-multi-row">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setListItem(c.id, 'phones', idx, e.target.value)}
                          placeholder="+91 9xxxxxxxxx"
                          className="hr-cell-input"
                        />
                        {c.phones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeListItem(c.id, 'phones', idx)}
                            className="hr-multi-remove-btn"
                            aria-label="Remove phone number"
                          >
                            <X className="w-3 h-3" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addListItem(c.id, 'phones')}
                      className="hr-add-value-btn"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2.5} />
                      Add number
                    </button>
                  </div>
                </td>
                <td>
                  <div className="hr-multi-cell">
                    {(c.emails.length ? c.emails : ['']).map((email, idx) => (
                      <div key={idx} className="hr-multi-row">
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setListItem(c.id, 'emails', idx, e.target.value)}
                          placeholder="name@company.com"
                          className="hr-cell-input"
                        />
                        {c.emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeListItem(c.id, 'emails', idx)}
                            className="hr-multi-remove-btn"
                            aria-label="Remove email"
                          >
                            <X className="w-3 h-3" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addListItem(c.id, 'emails')}
                      className="hr-add-value-btn"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2.5} />
                      Add email
                    </button>
                  </div>
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
            {filteredContacts.length === 0 && (
              <tr>
                <td colSpan={7} className="hr-empty-row">
                  {contacts.length === 0
                    ? 'No HR contacts yet — click "Add row" to start.'
                    : 'No contacts match your search/filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
