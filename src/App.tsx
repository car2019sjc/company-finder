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
import * as XLSX from 'xlsx';

function App() {
  // State management
  const [apiKey, setApiKey] = useLocalStorage<string>('apollo-api-key', import.meta.env.VITE_APOLLO_API_KEY || '');
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
    // Use API key from environment variable if available, otherwise use stored key
    const finalApiKey = import.meta.env.VITE_APOLLO_API_KEY || apiKey;
    if (finalApiKey) {
      apolloApiService.setApiKey(finalApiKey);
      // Update stored key if using environment variable
      if (import.meta.env.VITE_APOLLO_API_KEY && !apiKey) {
        setApiKey(finalApiKey);
      }
    }
  }, [apiKey]);

  const handleSearch = async (filters: SearchFilters) => {
    const finalApiKey = import.meta.env.VITE_APOLLO_API_KEY || apiKey;
    if (!finalApiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      apolloApiService.setApiKey(finalApiKey);
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
    const finalApiKey = import.meta.env.VITE_APOLLO_API_KEY || apiKey;
    if (!finalApiKey) {
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
    const finalApiKey = import.meta.env.VITE_APOLLO_API_KEY || apiKey;
    if (!finalApiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsPeopleLoading(true);
    setError(null);
    setSelectedCompany(company);

    try {
      apolloApiService.setApiKey(finalApiKey);
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
    const finalApiKey = import.meta.env.VITE_APOLLO_API_KEY || apiKey;
    if (!finalApiKey) {
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
      apolloApiService.setApiKey(finalApiKey);
      
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
  // Função para extrair localização da empresa (mesma lógica do CompanyCard)
  const getCompanyLocation = (company: Company) => {
    // 1. PRIORIDADE MÁXIMA: headquarters_address (endereço completo da sede)
    if (company.headquarters_address && company.headquarters_address.trim()) {
      // Se contém vírgulas, tentar extrair cidade e estado
      if (company.headquarters_address.includes(',')) {
        const parts = company.headquarters_address.split(',').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          // Pegar as duas primeiras partes (geralmente cidade, estado)
          const cityState = parts.slice(0, 2).join(', ');
          return cityState;
        }
      }
      return company.headquarters_address;
    }
    
    // 2. CAMPOS ESPECÍFICOS DE LOCALIZAÇÃO GEOGRÁFICA
    const locationParts = [];
    
    // Buscar cidade em múltiplos campos possíveis
    const city = (company as any).city || 
                 (company as any).headquarters_city || 
                 (company as any).primary_city ||
                 (company as any).organization_city ||
                 (company as any).location_city ||
                 (company as any).office_city;
                 
    // Buscar estado em múltiplos campos possíveis
    const state = (company as any).state || 
                  (company as any).headquarters_state || 
                  (company as any).primary_state ||
                  (company as any).organization_state ||
                  (company as any).location_state ||
                  (company as any).office_state;
                  
    // Buscar país em múltiplos campos possíveis
    const country = (company as any).country || 
                    (company as any).headquarters_country || 
                    (company as any).primary_country ||
                    (company as any).organization_country ||
                    (company as any).location_country;
    
    if (city) locationParts.push(city);
    if (state && state !== city) locationParts.push(state); // Evitar duplicação
    
    // Só adicionar país se não for Brasil (para evitar redundância)
    if (country && 
        country !== 'Brazil' && 
        country !== 'Brasil' && 
        country !== 'BR' &&
        !country.toLowerCase().includes('brazil')) {
      locationParts.push(country);
    }
    
    if (locationParts.length > 0) {
      return locationParts.join(', ');
    }
    
    // 3. ARRAYS DE LOCALIZAÇÃO
    if ((company as any).organization_locations && 
        Array.isArray((company as any).organization_locations) && 
        (company as any).organization_locations.length > 0) {
      const location = (company as any).organization_locations[0];
      
      // Se a localização contém vírgulas, tentar extrair cidade e estado
      if (typeof location === 'string' && location.includes(',')) {
        const parts = location.split(',').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          const cityState = parts.slice(0, 2).join(', ');
          return cityState;
        }
      }
      
      return location;
    }
    
    // 4. OUTROS CAMPOS DE LOCALIZAÇÃO
    const alternativeLocationFields = [
      'location',
      'headquarters',
      'primary_location',
      'office_location',
      'business_address',
      'registered_address'
    ];
    
    for (const field of alternativeLocationFields) {
      const value = (company as any)[field];
      if (value && typeof value === 'string' && value.trim()) {
        // Se contém vírgulas, tentar extrair cidade e estado
        if (value.includes(',')) {
          const parts = value.split(',').map(p => p.trim()).filter(p => p);
          if (parts.length >= 2) {
            const cityState = parts.slice(0, 2).join(', ');
            return cityState;
          }
        }
        
        return value;
      }
    }
    
    // 5. ARRAYS DE LOCALIZAÇÃO ALTERNATIVOS
    const locationArrayFields = [
      'organization_city_localities',
      'locations',
      'offices',
      'addresses'
    ];
    
    for (const field of locationArrayFields) {
      const array = (company as any)[field];
      if (Array.isArray(array) && array.length > 0) {
        const location = array[0];
        if (location && typeof location === 'string' && location.trim()) {
          // Se contém vírgulas, tentar extrair cidade e estado
          if (location.includes(',')) {
            const parts = location.split(',').map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
              const cityState = parts.slice(0, 2).join(', ');
              return cityState;
            }
          }
          
          return location;
        }
      }
    }
    
    // 6. ENDEREÇO COMPLETO COMO ÚLTIMO RECURSO
    const fullAddressFields = [
      'full_address',
      'address',
      'primary_address',
      'mailing_address',
      'street_address'
    ];
    
    for (const field of fullAddressFields) {
      const address = (company as any)[field];
      if (address && typeof address === 'string' && address.trim()) {
        // Tentar extrair cidade e estado do endereço completo
        if (address.includes(',')) {
          const addressParts = address.split(',').map(part => part.trim()).filter(p => p);
          if (addressParts.length >= 2) {
            // Para endereços brasileiros, geralmente cidade vem antes do estado
            const cityState = addressParts.slice(-2).join(', ');
            return cityState;
          }
        }
        
        return address;
      }
    }
    
    // 7. INFERIR LOCALIZAÇÃO DO DOMÍNIO
    if (company.primary_domain) {
      if (company.primary_domain.endsWith('.com.br') || 
          company.primary_domain.endsWith('.br')) {
        return 'Brasil';
      }
      
      // Outros domínios de países
      const domainCountryMap: { [key: string]: string } = {
        '.com.ar': 'Argentina',
        '.com.mx': 'México',
        '.com.co': 'Colômbia',
        '.com.pe': 'Peru',
        '.com.cl': 'Chile',
        '.com.uy': 'Uruguai',
        '.com.py': 'Paraguai',
        '.com.bo': 'Bolívia',
        '.com.ec': 'Equador',
        '.com.ve': 'Venezuela'
      };
      
      for (const [domain, country] of Object.entries(domainCountryMap)) {
        if (company.primary_domain.endsWith(domain)) {
          return country;
        }
      }
    }
    
    return 'N/A';
  };

  const handleExportCompanies = () => {
    if (companies.length === 0) {
      alert('Nenhuma empresa para exportar.');
      return;
    }
    
    console.log('🔍 Debug: Dados das empresas para exportação:', companies.map(c => ({
      name: c.name,
      location: getCompanyLocation(c),
      headquarters_address: c.headquarters_address,
      organization_city: c.organization_city,
      city: (c as any).city,
      state: (c as any).state,
      organization_state: c.organization_state
    })));
    
    const csvHeader = ['Nome', 'Setor', 'Localização', 'Funcionários', 'Site'];
    const csvRows = companies.map(company => [
      company.name,
      company.industry || '',
      getCompanyLocation(company),
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

  // Adicionar estados para exportação em lote
  const [batchExportData, setBatchExportData] = useState<Company[]>([]);
  const [batchExportProgress, setBatchExportProgress] = useState<{current: number, total: number, errors: number[]}>({current: 0, total: 0, errors: []});
  const [isBatchReady, setIsBatchReady] = useState(false);

  // Função para buscar empresas de várias páginas (corrigida para garantir todos os filtros)
  const fetchCompaniesPages = async (from: number, to: number) => {
    let allCompanies: Company[] = [];
    for (let page = from; page <= to; page++) {
      try {
      const response = await apolloApiService.searchCompanies({ ...currentFilters!, page, perPage: 25 });
      if (response.organizations) {
          console.log(`Página ${page}: ${response.organizations.length} empresas retornadas.`);
        allCompanies = allCompanies.concat(response.organizations);
        } else {
          console.warn(`Página ${page}: Nenhuma empresa retornada.`);
        }
      } catch (e) {
        console.error(`Erro ao buscar página ${page}:`, e);
      }
    }
    return allCompanies;
  };

  // Nova função para exportar todas as empresas disponíveis, ignorando o total de páginas informado
  const handleBatchExportAll = async () => {
    setIsExporting(true);
    setIsBatchReady(false);
    setBatchExportData([]);
    setBatchExportProgress({current: 0, total: 0, errors: []});
    let allCompanies: Company[] = [];
    let page = exportPageFrom;
    let errors: number[] = [];
    let keepGoing = true;
    let totalFetched = 0;
    while (keepGoing) {
      setBatchExportProgress(prev => ({...prev, current: page - exportPageFrom + 1}));
      try {
        const response = await apolloApiService.searchCompanies({ ...currentFilters!, page, perPage: 25 });
        if (response.organizations && response.organizations.length > 0) {
          // Marcar empresas com o número da página
          const companiesWithPage = response.organizations.map((c: any) => ({ ...c, _page: page }));
          allCompanies = allCompanies.concat(companiesWithPage);
          totalFetched += response.organizations.length;
          page++;
        } else {
          keepGoing = false;
        }
      } catch (e) {
        errors.push(page);
        keepGoing = false;
      }
    }
    setBatchExportData(allCompanies);
    setBatchExportProgress(prev => ({...prev, errors, total: page - exportPageFrom}));
    setIsExporting(false);
    setIsBatchReady(errors.length === 0);
    console.log(`Total de empresas coletadas: ${allCompanies.length}`);
  };

  // Substituir o botão de exportação múltipla para usar handleBatchExportAll
  // No modal, ajustar o texto para informar que a exportação foi feita até o fim dos dados disponíveis.

  // Função para baixar o CSV após processamento
  const handleDownloadBatchCSV = () => {
    if (batchExportData.length === 0) return;
    const csvHeader = ['Nome', 'Setor', 'Localização', 'Funcionários', 'Site'];
    const csvRows = batchExportData.map(company => [
      company.name,
      company.industry || '',
      getCompanyLocation(company),
      company.num_employees || '',
      company.website_url || ''
      ]);
      const csvContent = '\uFEFF' + [csvHeader, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
    link.setAttribute('download', `empresas_export_lote_${exportPageFrom}_a_${exportPageTo}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Função utilitária para extrair cidade, estado e país de forma robusta
  function extractCityStateCountry(company: Company): { city: string, state: string, country: string } {
    // 1. Tentar headquarters_address
    if (company.headquarters_address && company.headquarters_address.includes(',')) {
      const parts = company.headquarters_address.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length === 1) {
        // Ex: 'Brasil'
        return { city: '', state: '', country: parts[0] };
      } else if (parts.length === 2) {
        // Ex: 'São Paulo, Brasil'
        return { city: parts[0], state: '', country: parts[1] };
      } else if (parts.length >= 3) {
        // Ex: 'São Paulo, SP, Brasil'
        return { city: parts[0], state: parts[1], country: parts[2] };
      }
    } else if (company.headquarters_address && company.headquarters_address.trim()) {
      // Se só tem um valor e não tem vírgula
      return { city: '', state: '', country: company.headquarters_address.trim() };
    }
    // 2. Procurar nos campos específicos
    let city = (company as any).city || (company as any).organization_city || '';
    let state = (company as any).state || (company as any).organization_state || '';
    let country = (company as any).country || (company as any).organization_country || '';

    // 3. Se algum campo estiver vazio, tentar preencher com breadcrumbs globais
    if ((!city || !state || !country) && Array.isArray(batchExportData) && batchExportData.length > 0) {
      // Procurar breadcrumbs na resposta da busca (usando o escopo do App)
      if (typeof window !== 'undefined' && (window as any).__lastBreadcrumbs) {
        const breadcrumbs = (window as any).__lastBreadcrumbs;
        for (const b of breadcrumbs) {
          if ((b.signal_field_name === 'organization_locations' || b.label === 'Company Locations') && b.display_name) {
            const parts = b.display_name.split(',').map((s: string) => s.trim());
            if (!city && parts[0]) city = parts[0];
            if (!state && parts[1]) state = parts[1];
            if (!country && parts[2]) country = parts[2];
          }
        }
      }
    }
    return {
      city,
      state,
      country
    };
  }

  // Salvar os breadcrumbs globais ao buscar empresas em lote
  React.useEffect(() => {
    if (typeof window !== 'undefined' && batchExportData && batchExportData.length > 0 && (window as any).__lastBreadcrumbs === undefined) {
      // Tenta pegar os breadcrumbs do último resultado
      if ((companies as any).breadcrumbs) {
        (window as any).__lastBreadcrumbs = (companies as any).breadcrumbs;
      }
    }
  }, [batchExportData, companies]);

  const [locationEnrichmentProgress, setLocationEnrichmentProgress] = useState<{current: number, total: number}>({current: 0, total: 0});

  // Função para enriquecer localização das empresas antes da exportação, com controle de rate limit
  async function enrichCompaniesWithLocation(companies: Company[]): Promise<Company[]> {
    const enriched: Company[] = [...companies];
    setLocationEnrichmentProgress({current: 0, total: companies.length});
    let lastRequestTime = 0;
    let rateLimitHit = false;
    let rateLimitReset = 0;
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const hasLocation = (company as any).city || (company as any).organization_city || (company as any).state || (company as any).organization_state || (company as any).country || (company as any).organization_country;
      if (!hasLocation && company.website_url) {
        // Controle de rate limit: máximo 60 requisições por minuto (OpenAI gpt-4o)
        const now = Date.now();
        const minInterval = 1100; // 1,1s entre requisições (para segurança)
        if (now - lastRequestTime < minInterval) {
          await new Promise(res => setTimeout(res, minInterval - (now - lastRequestTime)));
        }
        lastRequestTime = Date.now();
        try {
          const loc = await fetchLocationFromWebsite(company.website_url);
          if (loc) {
            (enriched[i] as any).city = loc.city;
            (enriched[i] as any).state = loc.state;
            (enriched[i] as any).country = loc.country;
          }
        } catch (err: any) {
          if (err && err.message && err.message.includes('429')) {
            rateLimitHit = true;
            rateLimitReset = Date.now() + 65000;
            setGlobalNotification({ type: 'info', message: 'Limite de requisições da OpenAI atingido. Aguardando 65 segundos para retomar o enriquecimento de localização...' });
            await new Promise(res => setTimeout(res, 65000));
            i--; // Tentar novamente a mesma empresa
            continue;
          }
        }
      }
      setLocationEnrichmentProgress({current: i+1, total: companies.length});
    }
    if (rateLimitHit) {
      setGlobalNotification({ type: 'success', message: 'Enriquecimento de localização retomado após pausa para respeitar o limite da OpenAI.' });
    }
    return enriched;
  }

  // No JSX, exibir barra de progresso clara durante o enriquecimento:
  // {locationEnrichmentProgress.total > 0 && (
  //   <div className="my-4 text-blue-700 font-medium">Enriquecendo localização das empresas: {locationEnrichmentProgress.current} / {locationEnrichmentProgress.total}</div>
  // )}

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

  // Função utilitária para checar unicidade dos IDs
  function hasDuplicateOrMissingIds(companies: Company[]) {
    const seen = new Set();
    for (const c of companies) {
      if (!c.id || seen.has(c.id)) return true;
      seen.add(c.id);
    }
    return false;
  }

  const MAX_EXPORT_PAGES = 6;

  // Função para extrair cidade, estado e país do site da empresa usando OpenAI (versão anterior)
  async function fetchLocationFromWebsite(websiteUrl: string): Promise<{ city: string, state: string, country: string } | null> {
    if (!websiteUrl) return null;
    try {
      // Prompt para a IA
      const prompt = `Acesse o site oficial da empresa: ${websiteUrl}\nProcure por qualquer menção ao endereço, localização, cidade, estado ou país da empresa.\nPriorize informações em seções como “Contato”, “Sobre”, rodapé ou página institucional.\nSe encontrar, responda apenas no formato:\nCidade: [cidade]\nEstado: [estado]\nPaís: [país]\nSe não encontrar, responda apenas com: Cidade: N/A, Estado: N/A, País: N/A.`;
      // Chamada à API OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0,
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      // Extrair cidade, estado e país do texto retornado
      const cityMatch = text.match(/Cidade:\s*([^\n,]*)/i);
      const stateMatch = text.match(/Estado:\s*([^\n,]*)/i);
      const countryMatch = text.match(/Pa[ií]s:\s*([^\n,]*)/i);
      return {
        city: cityMatch ? cityMatch[1].trim() : '',
        state: stateMatch ? stateMatch[1].trim() : '',
        country: countryMatch ? countryMatch[1].trim() : ''
      };
    } catch (err) {
      console.error('Erro ao buscar localização via OpenAI:', err);
      return null;
    }
  }

  // Calcular o total esperado de empresas para exportação em lote
  const expectedBatchTotal = (exportPageTo - exportPageFrom + 1) * 25;

  // Função para reprocessar páginas com erro (até 3 tentativas)
  async function reprocessFailedPages() {
    if (batchExportProgress.errors.length === 0) return;
    let errorsToRetry = [...batchExportProgress.errors];
    let attempts = 0;
    let allCompanies = [...batchExportData];
    let newErrors: number[] = [];
    setIsExporting(true);
    while (errorsToRetry.length > 0 && attempts < 3) {
      newErrors = [];
      for (const page of errorsToRetry) {
        try {
          const response = await apolloApiService.searchCompanies({ ...currentFilters!, page, perPage: 25 });
          if (response.organizations) {
            // Remover empresas antigas dessa página, se existirem
            allCompanies = allCompanies.filter(c => (c as any)._page !== page);
            // Marcar as empresas novas com o número da página
            const companiesWithPage = response.organizations.map((c: any) => ({ ...c, _page: page }));
            allCompanies = allCompanies.concat(companiesWithPage);
          } else {
            newErrors.push(page);
          }
        } catch (e) {
          newErrors.push(page);
        }
      }
      errorsToRetry = newErrors;
      attempts++;
    }
    // Atualizar o batchExportData e o progresso
    setBatchExportData(allCompanies);
    setBatchExportProgress(prev => ({ ...prev, errors: errorsToRetry }));
    setIsExporting(false);
    setIsBatchReady(errorsToRetry.length === 0);
  }

  // Ao fechar o modal de exportação ou após exportar, resetar exportPageFrom e exportPageTo para 1
  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
    setExportPageFrom(1);
    setExportPageTo(1);
  };

  const handleDownloadBatchXLSX = async () => {
    if (batchExportData.length === 0) return;
    setLocationEnrichmentProgress({current: 0, total: batchExportData.length});
    const enrichedCompanies = await enrichCompaniesWithLocation(batchExportData);
    setLocationEnrichmentProgress({current: 0, total: 0});
    const wsData = [
      ['Nome', 'Setor', 'Cidade', 'Estado', 'País', 'Funcionários (Faixa)', 'Telefone', 'Site', 'LinkedIn'],
      ...enrichedCompanies.map(company => {
        const { city, state, country } = extractCityStateCountry(company);
        return [
          company.name,
          company.industry || '',
          city,
          state,
          country,
          company.num_employees_range || '',
          company.phone || (company.primary_phone && company.primary_phone.number) || '',
          company.website_url || '',
          company.linkedin_url || ''
        ];
      })
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
    XLSX.writeFile(wb, `empresas_export_lote_${exportPageFrom}_a_${exportPageTo}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Função para exportar apenas o intervalo de páginas definido pelo usuário
  const handleBatchExportRange = async () => {
    setIsExporting(true);
    setIsBatchReady(false);
    setBatchExportData([]);
    setBatchExportProgress({current: 0, total: exportPageTo - exportPageFrom + 1, errors: []});
    let allCompanies: Company[] = [];
    let errors: number[] = [];
    for (let page = exportPageFrom; page <= exportPageTo; page++) {
      setBatchExportProgress(prev => ({...prev, current: page - exportPageFrom + 1}));
      try {
        const response = await apolloApiService.searchCompanies({ ...currentFilters!, page, perPage: 25 });
        if (response.organizations && response.organizations.length > 0) {
          const companiesWithPage = response.organizations.map((c: any) => ({ ...c, _page: page }));
          allCompanies = allCompanies.concat(companiesWithPage);
        } else {
          errors.push(page);
        }
      } catch (e) {
        errors.push(page);
      }
    }
    setBatchExportData(allCompanies);
    setBatchExportProgress(prev => ({...prev, errors}));
    setIsExporting(false);
    setIsBatchReady(errors.length === 0);
    console.log(`Total de empresas coletadas: ${allCompanies.length}`);
  };

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
          isLoading={isLoading}
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

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Resultados da Busca ({totalResults} empresas encontradas)
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {companies.length} de {totalResults} empresas
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportCompanies}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Exportar Atual
                    </button>
                    <button
                      onClick={() => {
                        setIsExportModalOpen(true);
                        setIsBatchReady(false);
                        setBatchExportData([]);
                        setBatchExportProgress({current: 0, total: 0, errors: []});
                      }}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Exportar Múltiplas Páginas
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onSearchPeople={openPeopleSearchModal}
                    onQuickPeopleSearch={handleQuickPeopleSearch}
                    sectorFilter={sectorFilter}
                  />
                ))}
          </div>
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
                  <p className="text-sm text-gray-600">Processando página {batchExportProgress.current} de {batchExportProgress.total}...</p>
                  {batchExportProgress.errors.length > 0 && (
                    <p className="text-xs text-red-600 mt-2">Falha nas páginas: {batchExportProgress.errors.join(', ')}</p>
                  )}
                </div>
              ) : isBatchReady ? (
                <div className="text-center py-4">
                  <p className="text-green-700 font-semibold mb-2">Processamento concluído!</p>
                  {isBatchReady && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm text-gray-700">
                        Páginas selecionadas: {exportPageFrom} até {exportPageTo}
                      </div>
                      <div className="mb-2 text-sm text-gray-700">
                        Empresas processadas: {batchExportData.length} (exportado até o fim dos dados disponíveis)
                      </div>
                      {/* Detalhamento por página */}
                      <div className="mb-2 text-xs text-gray-600">
                        {Array.isArray(batchExportData) && batchExportData.length > 0 && (() => {
                          // Agrupar empresas por página (usando campo auxiliar _page)
                          const pageCounts: Record<number, number> = {};
                          batchExportData.forEach((c: any) => {
                            if (c._page) {
                              pageCounts[c._page] = (pageCounts[c._page] || 0) + 1;
                            }
                          });
                          // Gerar linhas para cada página processada
                          return Object.entries(pageCounts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([page, count]) => (
                            <div key={page}>Página {page}: {count} empresas</div>
                          ));
                        })()}
                      </div>
                      {batchExportData.length < expectedBatchTotal && batchExportProgress.errors.length === 0 && (
                        <div className="text-yellow-600 text-xs mb-2">Nem todas as páginas retornaram 25 empresas. O download trará apenas as empresas encontradas.</div>
                      )}
                      {batchExportProgress.errors.length === 0 ? (
                        <button
                          onClick={handleDownloadBatchXLSX}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50"
                          disabled={locationEnrichmentProgress.total > 0}
                        >
                          Baixar XLSX
                        </button>
                      ) : (
                        <div className="text-red-600 text-sm font-medium mt-2">
                          Erro ao processar as páginas: {batchExportProgress.errors.join(', ')}. Refaça a exportação dessas páginas para liberar o download.
                        </div>
                      )}
                    </div>
                  )}
                  {batchExportProgress.errors.length > 0 && (
                    <p className="text-xs text-red-600 mt-2">Falha nas páginas: {batchExportProgress.errors.join(', ')}. Tente novamente essas páginas se necessário.</p>
                  )}
                  {isBatchReady && batchExportProgress.errors.length > 0 && (
                    <button
                      onClick={reprocessFailedPages}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium mt-2"
                      disabled={isExporting}
                    >
                      Reprocessar páginas com erro
                    </button>
                  )}
                  <button
                    onClick={handleCloseExportModal}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Fechar
                  </button>
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
              <div className="flex justify-end space-x-2">
                <button 
                      onClick={handleCloseExportModal} 
                  disabled={isExporting}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                      Cancelar
                </button>
                  <button 
                      onClick={handleBatchExportRange} 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                      disabled={isExporting}
                  >
                      Iniciar Exportação
                  </button>
                  </div>
                </>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;