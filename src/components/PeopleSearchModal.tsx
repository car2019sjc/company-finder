import React, { useState } from 'react';
import { X, Search, Users, MapPin, Briefcase } from 'lucide-react';
import type { PeopleSearchFilters, Company } from '../types/apollo';

interface PeopleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: PeopleSearchFilters) => void;
  company: Company;
  isLoading: boolean;
}

export const PeopleSearchModal: React.FC<PeopleSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  company,
  isLoading,
}) => {
  // Inicializar filtros com dados da empresa selecionada
  const [filters, setFilters] = useState<PeopleSearchFilters>(() => ({
    organizationId: company.organization_id || company.id,
    personTitles: [],
    personSeniorities: [],
    personLocations: [],
    keywords: '',
    page: 1,
    perPage: 100, // Aumentar para 100 resultados por página
  }));

  const [titleInput, setTitleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const seniorities = [
    { value: 'owner', label: 'Owner' },
    { value: 'founder', label: 'Founder' },
    { value: 'c_suite', label: 'C-Suite' },
    { value: 'partner', label: 'Partner' },
    { value: 'vp', label: 'VP' },
    { value: 'head', label: 'Head' },
    { value: 'director', label: 'Director' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior', label: 'Senior' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'intern', label: 'Intern' },
  ];

  const commonTitles = [
    'CEO', 'CTO', 'CFO', 'VP Sales', 'VP Marketing', 'VP Engineering',
    'Sales Manager', 'Marketing Manager', 'Engineering Manager',
    'Sales Director', 'Marketing Director', 'Engineering Director',
    'Software Engineer', 'Data Scientist', 'Product Manager',
    'Business Development', 'Account Executive', 'Customer Success'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📋 Modal - Dados da empresa:', { id: company.id, organization_id: company.organization_id });
    console.log('📋 Modal - Filtros antes da validação:', filters);
    
    // Validação mais rigorosa para garantir filtros específicos
    const hasSpecificFilters = (filters.personTitles && filters.personTitles.length > 0) ||
                              (filters.personSeniorities && filters.personSeniorities.length > 0) ||
                              (filters.keywords?.trim() && filters.keywords.trim().length > 2);
    
    if (!hasSpecificFilters) {
      alert('Para obter resultados precisos, adicione pelo menos:\n• Cargos específicos (ex: CEO, CTO, CFO)\n• Níveis de senioridade\n• Palavras-chave específicas (mínimo 3 caracteres)\n\nIsso evita resultados muito amplos e irrelevantes.');
      return;
    }
    
    // Aviso especial para buscas apenas por localização
    if (filters.personLocations && filters.personLocations.length > 0 && 
        (!filters.personTitles || filters.personTitles.length === 0) &&
        (!filters.personSeniorities || filters.personSeniorities.length === 0) &&
        (!filters.keywords || filters.keywords.trim().length < 3)) {
      const confirmSearch = confirm(
        'Você está buscando apenas por localização, sem especificar cargos ou senioridade.\n\n' +
        'Isso pode retornar muitos resultados irrelevantes.\n\n' +
        'Recomendamos adicionar cargos específicos (ex: CEO, CTO, Diretor) para melhores resultados.\n\n' +
        'Deseja continuar mesmo assim?'
      );
      if (!confirmSearch) {
        return;
      }
    }
    
    const finalFilters = { 
      ...filters, 
      page: 1,
      perPage: 100, // Garantir 100 resultados por página
      organizationId: company.organization_id || company.id
    };
    
    console.log('📋 Modal - Filtros finais enviados:', finalFilters);
    console.log('🎯 Títulos específicos solicitados:', finalFilters.personTitles);
    onSearch(finalFilters);
  };

  const addTitle = (title: string) => {
    if (title.trim() && !filters.personTitles?.includes(title.trim())) {
      setFilters(prev => ({
        ...prev,
        personTitles: [...(prev.personTitles || []), title.trim()]
      }));
      setTitleInput('');
    }
  };

  const removeTitle = (title: string) => {
    setFilters(prev => ({
      ...prev,
      personTitles: prev.personTitles?.filter(t => t !== title) || []
    }));
  };

  const addLocation = (location: string) => {
    if (location.trim() && !filters.personLocations?.includes(location.trim())) {
      setFilters(prev => ({
        ...prev,
        personLocations: [...(prev.personLocations || []), location.trim()]
      }));
      setLocationInput('');
    }
  };

  const removeLocation = (location: string) => {
    setFilters(prev => ({
      ...prev,
      personLocations: prev.personLocations?.filter(l => l !== location) || []
    }));
  };

  const toggleSeniority = (seniority: string) => {
    setFilters(prev => ({
      ...prev,
      personSeniorities: prev.personSeniorities?.includes(seniority)
        ? prev.personSeniorities.filter(s => s !== seniority)
        : [...(prev.personSeniorities || []), seniority]
    }));
  };

  // Atualizar filtros quando a empresa mudar
  React.useEffect(() => {
    console.log('🔄 Atualizando filtros do modal para empresa:', company.name);
    console.log('🏢 Company ID:', company.id, 'Organization ID:', company.organization_id);
    
    setFilters(prev => ({
      ...prev,
      organizationId: company.organization_id || company.id
    }));
    
    // Limpar campos de entrada quando empresa mudar
    setTitleInput('');
    setLocationInput('');
    
    console.log('✅ Filtros atualizados com organizationId:', company.organization_id || company.id);
  }, [company.id, company.organization_id]);

  // Reset filters when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('🚪 Modal aberto - resetando filtros para empresa:', company.name);
      setFilters({
        organizationId: company.organization_id || company.id,
        personTitles: [],
        personSeniorities: [],
        personLocations: [],
        keywords: '',
        page: 1,
       perPage: 100,
      });
      setTitleInput('');
      setLocationInput('');
    }
  }, [isOpen, company.id, company.organization_id]);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${!isOpen ? 'hidden' : ''}`}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Search People</h3>
              <p className="text-sm text-gray-600">
                Find employees at <strong>{company.name}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Organization ID: {company.organization_id || company.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da empresa e dicas */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-blue-800">🎯 Buscando funcionários em: {company.name}</h4>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                ID: {company.organization_id || company.id}
              </span>
            </div>
            <h5 className="text-sm font-medium text-blue-700 mb-1">⚠️ IMPORTANTE - Para resultados precisos:</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>SEMPRE especifique cargos exatos:</strong> "CEO", "CTO", "CFO", "Diretor"</li>
              <li>• <strong>Combine múltiplos filtros:</strong> cargo + senioridade para maior precisão</li>
              <li>• <strong>Evite buscas muito amplas:</strong> sem filtros específicos retorna resultados irrelevantes</li>
              <li>• <strong>Para C-Level:</strong> use "CEO", "CTO", "CFO" + senioridade "C-Suite"</li>
              <li>• <strong>Para Diretores:</strong> use "Diretor" + especifique área se necessário</li>
              <li>• <strong>Empresa:</strong> {company.name} (ID: {company.organization_id || company.id})</li>
            </ul>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                <strong>🎯 Exemplo de busca precisa:</strong> Para diretores, digite "Diretor" nos cargos específicos + marque "Director" na senioridade
              </p>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palavras-chave
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Buscar por departamentos, habilidades ou áreas de interesse
            </p>
            <input
              type="text"
              value={filters.keywords}
              onChange={(e) => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder={`ex: vendas, marketing, engenharia (em ${company.name})`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Job Titles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargos Específicos
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Adicione cargos específicos que você quer encontrar em {company.name}
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTitle(titleInput))}
                placeholder={`ex: CEO, Diretor de Vendas (${company.name})`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addTitle(titleInput)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
            
            {/* Common titles */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Cargos comuns:</p>
              <div className="flex flex-wrap gap-1">
                {commonTitles.map(title => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => addTitle(title)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected titles */}
            {filters.personTitles && filters.personTitles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.personTitles.map(title => (
                  <span
                    key={title}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {title}
                    <button
                      type="button"
                      onClick={() => removeTitle(title)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Seniority Levels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Níveis de Senioridade
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {seniorities.map(seniority => (
                <label key={seniority.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.personSeniorities?.includes(seniority.value) || false}
                    onChange={() => toggleSeniority(seniority.value)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{seniority.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização da Pessoa
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Filtrar por localização específica dos funcionários
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation(locationInput))}
                placeholder={`ex: São Paulo, Rio de Janeiro, Remoto`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addLocation(locationInput)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>

            {/* Selected locations */}
            {filters.personLocations && filters.personLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.personLocations.map(location => (
                  <span
                    key={location}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {location}
                    <button
                      type="button"
                      onClick={() => removeLocation(location)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('🔄 Resetando filtros para empresa:', company.name);
                setFilters({
                  organizationId: company.organization_id || company.id,
                  personTitles: [],
                  personSeniorities: [],
                  personLocations: [],
                  keywords: '',
                  page: 1,
                  perPage: 100,
                });
                setTitleInput('');
                setLocationInput('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-md hover:from-blue-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center shadow-lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Buscando...' : `🔍 Buscar em ${company.name}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};