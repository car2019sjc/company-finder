import React, { useState } from 'react';
import { Mail, Download, Users, Loader, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import type { Person, EmailSearchResponse } from './types/apollo';
import { captureEmailsFromPersons } from './services/emailCapture';
import { SearchForm } from './components/SearchForm';
import { CompanyCard } from './components/CompanyCard';
import { IndustryFilter } from './components/IndustryFilter';
import { Pagination } from './components/Pagination';
import { ErrorMessage } from './components/ErrorMessage';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PeopleSearchModal } from './components/PeopleSearchModal';
import { PeopleLeadsModal } from './components/PeopleLeadsModal';
import { BatchEmailCapture } from './components/BatchEmailCapture';
import { LeadsTable } from './components/LeadsTable';
import { apolloApiService } from './services/apolloApi';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { SearchFilters, Company, PeopleSearchFilters, Person as PersonType } from './types/apollo';

function App() {
  // State management
  const [apiKey, setApiKey] = useLocalStorage<string>('apollo-api-key', '');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [people, setPeople] = useState<PersonType[]>([]);
  const [savedPeople, setSavedPeople] = useState<PersonType[]>([]);
  const [savedCompanies, setSavedCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'industry' | 'employees' | 'revenue'>('name');
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);
  
  // Modal states
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPeopleSearchModalOpen, setIsPeopleSearchModalOpen] = useState(false);
  const [isPeopleLeadsModalOpen, setIsPeopleLeadsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Estado para notificações globais
  const [globalNotification, setGlobalNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Função para mostrar notificação global
  const showGlobalNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setGlobalNotification({ type, message });
    
    // Auto-hide after 6 seconds
    setTimeout(() => {
      setGlobalNotification(null);
    }, 6000);
  };

  // Set API key when component mounts or when apiKey changes
  React.useEffect(() => {
    if (apiKey) {
      apolloApiService.setApiKey(apiKey);
    }
  }, [apiKey]);

  const handleSearch = async (filters: SearchFilters) => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      apolloApiService.setApiKey(apiKey);
      const response = await apolloApiService.searchCompanies(filters);
      
      setCompanies(response.organizations || []);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.total_pages);
      setTotalResults(response.pagination.total_entries);
      
      // Reset filters when new search is performed
      setSelectedIndustries([]);
      setSortBy('name');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCompanies([]);
      setTotalPages(0);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!currentFilters) return;
    
    const newFilters = { ...currentFilters, page };
    await handleSearch(newFilters);
  };

  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey);
    apolloApiService.setApiKey(newApiKey);
  };

  const handlePeopleSearch = async (filters: PeopleSearchFilters) => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsPeopleLoading(true);
    setError(null);

    try {
      apolloApiService.setApiKey(apiKey);
      const response = await apolloApiService.searchPeople(filters);
      
      const foundPeople = response.contacts || response.people || [];
      setPeople(foundPeople);
      
      if (foundPeople.length > 0) {
        setIsPeopleSearchModalOpen(false);
        setIsPeopleLeadsModalOpen(true);
      } else {
        setError('No people found with the specified criteria. Try adjusting your search filters.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while searching for people';
      setError(errorMessage);
      setPeople([]);
    } finally {
      setIsPeopleLoading(false);
    }
  };

  const handleQuickPeopleSearch = async (company: Company, filters: PeopleSearchFilters) => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsPeopleLoading(true);
    setError(null);
    setSelectedCompany(company);

    try {
      apolloApiService.setApiKey(apiKey);
      const response = await apolloApiService.searchPeople(filters);
      
      const foundPeople = response.contacts || response.people || [];
      setPeople(foundPeople);
      
      if (foundPeople.length > 0) {
        setIsPeopleLeadsModalOpen(true);
      } else {
        setError(`No people found at ${company.name}. The company might not have detailed employee information available.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while searching for people';
      setError(errorMessage);
      setPeople([]);
    } finally {
      setIsPeopleLoading(false);
    }
  };

  const handleEmailSearch = async (personId: string, organizationId?: string) => {
    if (!apiKey) {
      console.error('❌ API key é obrigatória para busca de email');
      return {
        person: { id: personId, name: 'Unknown', title: 'Unknown' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ API key é obrigatória para buscar emails'
      };
    }

    console.log(`🔍 App.tsx - handleEmailSearch iniciado para ID: ${personId}`);
    console.log(`🏢 Organization ID: ${organizationId}`);

    try {
      apolloApiService.setApiKey(apiKey);
      
      // Add timeout and error handling to prevent app crash
      const response = await Promise.race([
        apolloApiService.searchPersonEmails({
          personId,
          organizationId
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Busca de email demorou mais de 45 segundos')), 45000)
        )
      ]);
      
      console.log('✅ App.tsx - Resposta da busca de email:', response);
      
      // Show success notification if emails found
      if (response.success && response.emails && response.emails.length > 0) {
        const emailList = response.emails.map(e => e.email).join(', ');
        showGlobalNotification('success', `✅ ${response.emails.length} email(s) encontrado(s): ${emailList.substring(0, 80)}${emailList.length > 80 ? '...' : ''}`);
      } else if (response.success && response.phone_numbers && response.phone_numbers.length > 0) {
        showGlobalNotification('success', `📞 ${response.phone_numbers.length} telefone(s) encontrado(s)`);
      } else if (!response.success) {
        showGlobalNotification('info', `❌ Nenhum email encontrado. ${response.message?.substring(0, 100) || ''}`);
      }
      
      return response;
    } catch (err) {
      console.error('❌ App.tsx - Erro na busca de email:', err);
      
      // Return safe response instead of throwing to prevent app crash
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na busca de email';
      
      showGlobalNotification('error', `❌ Erro na busca: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`);
      
      return {
        person: { id: personId, name: 'Erro na busca', title: 'N/A' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: `❌ ${errorMessage}\n\n💡 Sugestões:\n• Verifique sua conexão com a internet\n• Confirme se seu plano Apollo.io permite busca de emails\n• Tente novamente em alguns segundos`
      };
    }
  };

  const openPeopleSearchModal = (company: Company) => {
    setSelectedCompany(company);
    setIsPeopleSearchModalOpen(true);
  };

  const handleNewSearch = () => {
    setCompanies([]);
    setPeople([]);
    setCurrentFilters(null);
    setError(null);
    setCurrentPage(1);
    setTotalPages(0);
    setTotalResults(0);
    setSelectedIndustries([]);
    setSortBy('name');
  };

  const handleExportLeads = () => {
    const allLeads = [...savedPeople, ...savedCompanies];
    if (allLeads.length === 0) {
      alert('No leads to export');
      return;
    }

    const csvContent = [
      '\uFEFF' + ['Type', 'Name', 'Title', 'Company', 'Email', 'Phone', 'Location', 'LinkedIn'].join(','),
      ...savedPeople.map(person => {
        const location = [person.city, person.state, person.country].filter(Boolean).join(', ') || 'N/A';
        return [
          '"Person"',
          `"${person.name || 'N/A'}"`,
          `"${person.title || 'N/A'}"`,
          `"${person.organization?.name || person.account?.name || 'N/A'}"`,
          `"${person.email || 'N/A'}"`,
          `"${person.phone_numbers?.[0]?.raw_number || 'N/A'}"`,
          `"${location}"`,
          `"${person.linkedin_url || 'N/A'}"`
        ].join(',');
      }),
      ...savedCompanies.map(company => [
        '"Company"',
        `"${company.name || 'N/A'}"`,
        '"Company"',
        `"${company.industry || 'N/A'}"`,
        '"N/A"',
        `"${company.primary_phone?.number || 'N/A'}"`,
        `"${company.headquarters_address || 'N/A'}"`,
        `"${company.linkedin_url || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllLeads = () => {
    if (confirm('Are you sure you want to clear all saved leads?')) {
      setSavedPeople([]);
      setSavedCompanies([]);
    }
  };

  // Filter and sort companies
  const filteredAndSortedCompanies = React.useMemo(() => {
    let filtered = companies;

    // Apply industry filter
    if (selectedIndustries.length > 0) {
      filtered = filtered.filter(company => {
        if (!company.industry) return false;
        
        const industryTranslation: { [key: string]: string } = {
          'Agriculture': 'Agronegócio',
          'Information Technology': 'Tecnologia',
          'Healthcare': 'Saúde',
          'Financial Services': 'Finanças',
          'Manufacturing': 'Manufatura',
          'Construction': 'Construção',
          'Real Estate': 'Imobiliário',
          'Education': 'Educação',
          'Retail': 'Varejo',
          'Telecommunications': 'Telecomunicações',
        };
        
        const translatedIndustry = industryTranslation[company.industry] || company.industry;
        return selectedIndustries.includes(company.industry) || selectedIndustries.includes(translatedIndustry);
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'industry':
          return (a.industry || '').localeCompare(b.industry || '');
        case 'employees':
          return (b.num_employees || 0) - (a.num_employees || 0);
        case 'revenue':
          return (b.annual_revenue || 0) - (a.annual_revenue || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [companies, selectedIndustries, sortBy]);

  // Adicionar função para exportar empresas filtradas para CSV
  const handleExportCompanies = () => {
    if (filteredAndSortedCompanies.length === 0) {
      alert('Nenhuma empresa para exportar.');
      return;
    }
    const csvHeader = ['Nome', 'Setor', 'Localização', 'Funcionários', 'Site'];
    const csvRows = filteredAndSortedCompanies.map(company => [
      company.name,
      company.industry || '',
      company.headquarters_address || '',
      company.num_employees || '',
      company.website_url || ''
    ]);
    const csvContent = [csvHeader, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `empresas_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Adicionar estados para modal de exportação
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPageFrom, setExportPageFrom] = useState(1);
  const [exportPageTo, setExportPageTo] = useState(totalPages);
  const [isExporting, setIsExporting] = useState(false);

  // Função para buscar empresas de várias páginas
  const fetchCompaniesPages = async (from: number, to: number) => {
    let allCompanies: Company[] = [];
    for (let page = from; page <= to; page++) {
      const response = await apolloApiService.searchCompanies({ ...currentFilters!, page, perPage: 25 });
      if (response.organizations) {
        allCompanies = allCompanies.concat(response.organizations);
      }
    }
    return allCompanies;
  };

  // Substituir a função handleExportCompaniesPaged para buscar detalhes em lote
  const handleExportCompaniesPaged = async () => {
    setIsExporting(true);
    try {
      console.log('🚀 Iniciando exportação de empresas...');
      console.log('📊 Intervalo de páginas:', exportPageFrom, 'a', exportPageTo);
      
      // Validação do intervalo de páginas
      const pageRange = exportPageTo - exportPageFrom + 1;
      if (pageRange > 20) {
        alert('Por favor, exporte no máximo 20 páginas por vez para evitar travamentos.');
        setIsExporting(false);
        return;
      }
      
      // Buscar empresas de todas as páginas do intervalo usando os filtros atuais
      if (!currentFilters) {
        alert('Nenhum filtro de busca encontrado. Faça uma busca primeiro.');
        setIsExporting(false);
        return;
      }
      
      let allCompanies: Company[] = [];
      console.log('🔍 Buscando empresas de', exportPageTo - exportPageFrom + 1, 'páginas...');
      
      for (let page = exportPageFrom; page <= exportPageTo; page++) {
        console.log(`📄 Buscando página ${page}...`);
        try {
          // Adicionar timeout para evitar travamento
          const response = await Promise.race([
            apolloApiService.searchCompanies({ ...currentFilters, page, perPage: 25 }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error(`Timeout: Página ${page} demorou mais de 30 segundos`)), 30000)
            )
          ]);
          if (response.organizations) {
            allCompanies = allCompanies.concat(response.organizations);
            console.log(`✅ Página ${page}: ${response.organizations.length} empresas encontradas`);
          }
          
          // Adicionar delay entre requisições para evitar sobrecarregar a API
          if (page < exportPageTo) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
          }
        } catch (pageError) {
          console.error(`❌ Erro na página ${page}:`, pageError);
          // Continuar com as outras páginas mesmo se uma falhar
        }
      }
      
      console.log(`📊 Total de empresas coletadas: ${allCompanies.length}`);
      
      // Log detalhado dos campos relevantes antes do filtro/exportação
      console.log('👀 Empresas retornadas (detalhe):', allCompanies.map(c => ({
        name: c.name,
        num_employees: c.num_employees,
        num_employees_range: c.num_employees_range,
        industry: c.industry,
        organization_city: c.organization_city,
        organization_state: c.organization_state,
        organization_country: c.organization_country,
        city: (c as any).city,
        state: (c as any).state,
        country: (c as any).country,
        headquarters_address: c.headquarters_address,
        phone: c.phone,
        website_url: c.website_url,
      })));

      // Função utilitária para normalizar range textual para números
      function parseRange(str: string) {
        if (!str) return null;
        // Remove texto e espaços
        str = str.toLowerCase().replace(/funcionários|employees|\s|\./g, '');
        // Ex: '5mil-10mil' => '5mil-10mil'
        const match = str.match(/(\d+)(mil)?-(\d+)(mil)?/);
        if (match) {
          let min = parseInt(match[1], 10);
          let max = parseInt(match[3], 10);
          if (match[2]) min *= 1000;
          if (match[4]) max *= 1000;
          return { min, max };
        }
        // Ex: '3000+' ou '3mil+' => min=3000, max=Infinity
        const plus = str.match(/(\d+)(mil)?\+/);
        if (plus) {
          let min = parseInt(plus[1], 10);
          if (plus[2]) min *= 1000;
          return { min, max: Infinity };
        }
        // Ex: '5001,10000' => min=5001, max=10000
        const comma = str.match(/(\d+),(\d+)/);
        if (comma) {
          return { min: parseInt(comma[1], 10), max: parseInt(comma[2], 10) };
        }
        return null;
      }

      let filteredCompanies = allCompanies;
      const range = currentFilters.employeeRange;
      console.log('🔍 Aplicando filtro de funcionários:', range);
      if (range && range !== 'all') {
        const filtroRange = parseRange(range);
        filteredCompanies = allCompanies.filter(c => {
          // Tenta pelo campo numérico
          const n = c.num_employees || 0;
          let matchNumeric = false;
          if (filtroRange) {
            matchNumeric = n >= filtroRange.min && n <= filtroRange.max;
          }
          // Tenta pelo campo textual
          let matchText = false;
          if (c.num_employees_range) {
            const empresaRange = parseRange(c.num_employees_range);
            if (empresaRange && filtroRange) {
              // Verifica se os ranges se sobrepõem
              matchText = empresaRange.min <= filtroRange.max && empresaRange.max >= filtroRange.min;
            }
          }
          return matchNumeric || matchText;
        });
        console.log(`✅ Filtro ${range}: ${filteredCompanies.length} empresas após filtro`);
      }
      
      if (filteredCompanies.length === 0) {
        alert(`Nenhuma empresa para exportar após aplicar filtros.\nTotal retornado da API: ${allCompanies.length}\nTotal após filtro: 0`);
        setIsExportModalOpen(false);
        setIsExporting(false);
        return;
      }
      
      console.log('📝 Gerando CSV...');
      // Gerar CSV com todas as informações relevantes vindas da busca
      const csvHeader = [
        'Nome',
        'Site',
        'FTEs (Faixa)',
        'Ano de Fundação',
        'Telefone',
        'Cidade',
        'Estado',
        'País',
        'LinkedIn',
        'ID', // Agora a última coluna
      ];
      const csvRows = filteredCompanies.map(company => [
        company.name || 'N/A',
        company.website_url || 'N/A',
        currentFilters.employeeRange || 'N/A',
        company.founded_year || 'N/A',
        company.phone || company.primary_phone?.number || 'N/A',
        company.organization_city || (company as any).city || 'N/A',
        company.organization_state || (company as any).state || 'N/A',
        'Brasil',
        company.linkedin_url || 'N/A',
        company.id || 'N/A', // Agora a última coluna
      ]);
      const csvContent = '\uFEFF' + [csvHeader, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `empresas_export_${exportPageFrom}_a_${exportPageTo}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Exportação concluída com sucesso!');
      setIsExportModalOpen(false);
    } catch (e) {
      console.error('❌ Erro na exportação:', e);
      let msg = 'Erro ao exportar empresas.';
      if (e instanceof Error) msg += ' ' + e.message;
      else if (typeof e === 'string') msg += ' ' + e;
      alert(msg);
    }
    setIsExporting(false);
  };

  // Extrair setor do filtro dos breadcrumbs, se houver
  let sectorFilter = '';
  if (Array.isArray((companies as any).breadcrumbs)) {
    const bc = (companies as any).breadcrumbs.find((b: any) =>
      (b.signal_field_name === 'q_organization_keyword_tags' || b.label === 'Company Keywords Contain ANY Of') &&
      (b.value || b.display_name)
    );
    if (bc) {
      sectorFilter = bc.display_name || bc.value;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            OnSet.IA Company Search
          </h1>
          <p className="text-gray-600">
            Find and connect with companies and their employees
          </p>
        </header>

        {error && (
          <ErrorMessage 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}

        {/* Global Notification */}
        {globalNotification && (
          <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border ${
            globalNotification.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
            globalNotification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium pr-4">{globalNotification.message}</span>
              <button
                onClick={() => setGlobalNotification(null)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <SearchForm
          onSearch={handleSearch}
          onOpenApiKey={() => setIsApiKeyModalOpen(true)}
          isLoading={isLoading}
          hasApiKey={!!apiKey}
          hasResults={companies.length > 0}
          onNewSearch={handleNewSearch}
        />

        {companies.length > 0 && (
          <>
            <IndustryFilter
              companies={companies}
              selectedIndustries={selectedIndustries}
              onIndustryChange={setSelectedIndustries}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            {/* Botão de exportação de empresas */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
              >
                Exportar Empresas (CSV)
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Search Results ({totalResults} companies found)
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {filteredAndSortedCompanies.length} of {companies.length} companies
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    breadcrumbs={(typeof (companies as any).breadcrumbs !== 'undefined' ? (companies as any).breadcrumbs : [])}
                    sectorFilter={sectorFilter}
                    onSearchPeople={openPeopleSearchModal}
                    onQuickPeopleSearch={handleQuickPeopleSearch}
                  />
                ))}
              </div>

              {filteredAndSortedCompanies.length === 0 && companies.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No companies match the selected filters. Try adjusting your industry selection.
                  </p>
                </div>
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </>
        )}

        {/* Saved Leads Table */}
        {(savedPeople.length > 0 || savedCompanies.length > 0) && (
          <div className="mt-8">
            <LeadsTable
              people={savedPeople}
              companies={savedCompanies}
              title="Saved Leads"
              onExportData={handleExportLeads}
              onClearAll={handleClearAllLeads}
            />
          </div>
        )}

        {/* Modals */}
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSave={handleApiKeySave}
          currentApiKey={apiKey}
        />

        {selectedCompany && (
          <PeopleSearchModal
            isOpen={isPeopleSearchModalOpen}
            onClose={() => setIsPeopleSearchModalOpen(false)}
            onSearch={handlePeopleSearch}
            company={selectedCompany}
            isLoading={isPeopleLoading}
          />
        )}

        {selectedCompany && (
          <PeopleLeadsModal
            isOpen={isPeopleLeadsModalOpen}
            onClose={() => setIsPeopleLeadsModalOpen(false)}
            people={people}
            company={selectedCompany}
            onEmailSearch={handleEmailSearch}
          />
        )}

        {/* Modal de exportação paginada */}
        {isExportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Exportar Empresas (CSV)</h3>
              
              {isExporting ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Exportando empresas...</p>
                  <p className="text-xs text-gray-500 mt-1">Isso pode demorar alguns minutos</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Página inicial (de):</label>
                    <input type="number" min={1} max={totalPages} value={exportPageFrom} onChange={e => setExportPageFrom(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Página final (até):</label>
                    <input type="number" min={exportPageFrom} max={totalPages} value={exportPageTo} onChange={e => setExportPageTo(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
                  </div>
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Dica:</strong> Para melhor performance, exporte no máximo 10 páginas por vez.
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setIsExportModalOpen(false)} 
                  disabled={isExporting}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  {isExporting ? 'Aguarde...' : 'Cancelar'}
                </button>
                {!isExporting && (
                  <button 
                    onClick={handleExportCompaniesPaged} 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                  >
                    Exportar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;