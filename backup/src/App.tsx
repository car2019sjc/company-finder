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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Apollo.io Company Search
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

        {/* Batch Email Capture for selected people */}
        {people.length > 0 && (
          <div className="mt-8">
            <BatchEmailCapture
              persons={people}
              apolloApiKey={apiKey}
              onComplete={(results) => {
                console.log('Batch email capture completed:', results);
              }}
            />
          </div>
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
      </div>
    </div>
  );
}

export default App;