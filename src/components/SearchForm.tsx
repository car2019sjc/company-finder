import React, { useState } from 'react';
import { Search, MapPin, Users, Building } from 'lucide-react';
import type { SearchFilters } from '../types/apollo';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    companyName: '',
    location: 'Brasil',
    employeeRange: 'all',
    businessArea: '',
    page: 1,
    perPage: 25,
  });

  const employeeRanges = [
    { value: 'all', label: 'All sizes' },
    { value: '201,500', label: '201-500 employees' },
    { value: '501,1000', label: '501-1,000 employees' },
    { value: '1001,5000', label: '1,001-5,000 employees' },
    { value: '5001,10000', label: '5,001-10,000 employees' },
    { value: '10001,50000', label: '10,001+ employees' },
  ];

  const locationSuggestions = [
    'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
    'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia'
  ];

  const businessAreaSuggestions = [
    'Agronegócio', 'Tecnologia', 'Saúde', 'Finanças', 'Automotivo',
    'Logística', 'Hotelaria', 'Manufatura', 'Energia', 'Mineração',
    'Petróleo e Gás', 'Varejo', 'Construção',
    'Consultoria', 'Educação', 'Telecomunicações', 'Marketing',
    'Jurídico', 'Turismo', 'Imobiliário', 'Alimentação', 'E-commerce',
    'Farmacêutico', 'Têxtil', 'Metalurgia', 'Química', 'Papel e Celulose'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ ...filters, page: 1 });
  };

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSuggestion = (location: string) => {
    setFilters(prev => ({ ...prev, location }));
  };

  const handleBusinessAreaSuggestion = (area: string) => {
    setFilters(prev => ({ ...prev, businessArea: area }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="e.g., Apollo, Microsoft, Google"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (Recomendado) 🎯
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="ex: São Paulo, Rio de Janeiro, Brasil"
              className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
            />
          </div>
          {filters.location.length === 0 && (
            <div className="mt-2">
              <p className="text-xs text-blue-600 mb-1 font-medium">🇧🇷 Cidades populares no Brasil:</p>
              <div className="flex flex-wrap gap-1">
                {locationSuggestions.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleLocationSuggestion(city)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors border border-blue-300"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Area / Industry (Recomendado) 🎯
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.businessArea}
              onChange={(e) => handleInputChange('businessArea', e.target.value)}
              placeholder="ex: Agronegócio, Tecnologia, Saúde, Finanças"
              className="w-full pl-10 pr-4 py-2 border-2 border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50"
            />
          </div>
          {filters.businessArea.length === 0 && (
            <div className="mt-2">
              <p className="text-xs text-green-600 mb-1 font-medium">🏭 Setores populares no Brasil:</p>
              <div className="flex flex-wrap gap-1">
                {businessAreaSuggestions.slice(0, 12).map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleBusinessAreaSuggestion(area)}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors border border-green-300"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filters.employeeRange}
              onChange={(e) => handleInputChange('employeeRange', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {employeeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium shadow-lg"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
        ) : (
          <Search className="w-4 h-4 mr-2" />
        )}
        {isLoading ? 'Buscando Empresas...' : '🔍 Buscar Empresas'}
      </button>
    </form>
  );
}