import React, { useState } from 'react';
import { User, Building2, MapPin, Mail, Phone, ExternalLink, Eye, UserCheck, Trash2, Download, Search, Loader2 } from 'lucide-react';
import type { Person, Company } from '../types/apollo';
import { apolloApiService } from '../services/apolloApi';

interface Lead {
  id: string;
  name: string;
  title?: string;
  company: string;
  companySubtitle?: string;
  location: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  avatar?: string;
  initials: string;
  type: 'person' | 'company';
  originalData: Person | Company;
}

interface LeadsTableProps {
  people?: Person[];
  companies?: Company[];
  title?: string;
  onExportData?: () => void;
  onClearAll?: () => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  people = [],
  companies = [],
  title = "Saved Leads",
  onExportData,
  onClearAll
}) => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loadingPhoneId, setLoadingPhoneId] = useState<string | null>(null);
  const [leadsState, setLeadsState] = useState<Lead[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Converter pessoas e empresas para formato de leads
  const leads: Lead[] = [
    ...people.map(person => ({
      id: person.id,
      name: person.name,
      title: person.title,
      company: person.organization?.name || person.account?.name || 'N/A',
      companySubtitle: person.organization?.primary_domain || person.account?.primary_domain,
      location: [person.city, person.state, person.country].filter(Boolean).join(', ') || 'N/A',
      email: person.email || person.contact_emails?.[0]?.email,
      phone: person.phone_numbers?.[0]?.raw_number,
      linkedinUrl: person.linkedin_url,
      avatar: person.photo_url,
      initials: person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      type: 'person' as const,
      originalData: person
    })),
    ...companies.map(company => ({
      id: company.id,
      name: company.name,
      title: 'Company',
      company: company.industry || 'N/A',
      companySubtitle: company.primary_domain,
      location: company.headquarters_address || 'N/A',
      email: undefined,
      phone: company.primary_phone?.number,
      linkedinUrl: company.linkedin_url,
      avatar: company.logo_url,
      initials: company.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      type: 'company' as const,
      originalData: company
    }))
  ];

  React.useEffect(() => {
    setLeadsState(leads);
  }, [people, companies]);

  const totalLeads = leadsState.length;

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === totalLeads) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leadsState.map(lead => lead.id));
    }
  };

  const handlePhoneSearch = async (lead: Lead) => {
    setLoadingPhoneId(lead.id);
    setNotification(null);
    try {
      const apiKey = localStorage.getItem('apollo-api-key');
      if (!apiKey) {
        setNotification({ type: 'error', message: 'API Key não encontrada. Configure sua API Key primeiro.' });
        setLoadingPhoneId(null);
        return;
      }
      apolloApiService.setApiKey(JSON.parse(apiKey));
      const result = await apolloApiService.searchPersonEmails({ personId: lead.id, organizationId: undefined });
      if (result.success && result.phone_numbers && result.phone_numbers.length > 0) {
        const foundPhone = result.phone_numbers[0].raw_number;
        setLeadsState(prev => prev.map(l => l.id === lead.id ? { ...l, phone: foundPhone } : l));
        setNotification({ type: 'success', message: `Telefone encontrado para ${lead.name}: ${foundPhone}` });
      } else {
        setNotification({ type: 'info', message: `Nenhum telefone encontrado para ${lead.name}.` });
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: `Erro ao buscar telefone: ${error.message || 'Erro desconhecido'}` });
    } finally {
      setLoadingPhoneId(null);
    }
  };

  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (totalLeads === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-500">Search for companies or people to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {title} ({totalLeads})
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {onExportData && (
              <button
                onClick={onExportData}
                className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar com Dados
              </button>
            )}
            {onClearAll && (
              <button
                onClick={onClearAll}
                className="flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Limpar Tudo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedLeads.length === totalLeads && totalLeads > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-3">Name / Job Title</div>
          <div className="col-span-3">Company</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-3">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {leadsState.map((lead) => (
          <div key={lead.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Checkbox */}
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={() => handleSelectLead(lead.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Name / Job Title */}
              <div className="col-span-3">
                <div className="flex items-center">
                  {lead.avatar ? (
                    <img
                      src={lead.avatar}
                      alt={lead.name}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white text-sm font-medium ${getInitialsColor(lead.name)} ${lead.avatar ? 'hidden' : ''}`}>
                    {lead.initials}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500">{lead.title}</div>
                  </div>
                </div>
              </div>

              {/* Company */}
              <div className="col-span-3">
                <div className="font-medium text-gray-900">{lead.company}</div>
                {lead.companySubtitle && (
                  <div className="text-sm text-blue-600">{lead.companySubtitle}</div>
                )}
              </div>

              {/* Location */}
              <div className="col-span-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {lead.location}
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                    Lead Data
                  </button>
                  <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                    Análise
                  </button>
                  <button className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                    Profile
                  </button>
                  <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                    Remove
                  </button>
                  {/* Botão de telefone sempre visível para debug */}
                  <button
                    className={`px-2 py-1 text-xs flex items-center rounded transition-colors bg-orange-400 text-white`}
                    onClick={() => handlePhoneSearch(lead)}
                    disabled={!!loadingPhoneId}
                    title={lead.phone ? 'Telefone encontrado' : 'Buscar telefone'}
                  >
                    {loadingPhoneId === lead.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4 mr-1" />
                    )}
                    DEBUG TELEFONE
                  </button>
                  {/* Botão de email (já existente) */}
                  {lead.type === 'person' && (
                    <button
                      className={`px-2 py-1 text-xs flex items-center rounded transition-colors ${lead.email ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                      // Aqui você pode colocar a função de buscar email se desejar
                      disabled={!!loadingPhoneId}
                      title={lead.email ? 'Email encontrado' : 'Buscar email'}
                      style={{ marginLeft: '4px' }}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {lead.email ? 'Email Encontrado' : 'Buscar'}
                    </button>
                  )}
                  <a
                    href={lead.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                    title="Abrir LinkedIn"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Info Row (if available) */}
            {(lead.email || lead.phone || lead.linkedinUrl) && (
              <div className="mt-2 ml-14 flex items-center space-x-4 text-sm">
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center text-green-600 hover:text-green-800"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    {lead.phone}
                  </a>
                )}
                {lead.linkedinUrl && (
                  <a
                    href={lead.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 text-white ${notification.type === 'success' ? 'bg-green-600' : notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          {notification.message}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          This application uses the Apollo.io API for lead searches
        </p>
      </div>
    </div>
  );
};