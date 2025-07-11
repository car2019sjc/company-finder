import React from 'react';
import { ExternalLink, MapPin, Users, Calendar, DollarSign, Search } from 'lucide-react';
import type { Company, PeopleSearchFilters } from '../types/apollo';

interface CompanyCardProps {
  company: Company;
  onSearchPeople?: (company: Company) => void;
  onQuickPeopleSearch?: (company: Company, filters: PeopleSearchFilters) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onSearchPeople, onQuickPeopleSearch }) => {
  const formatNumber = (num: number | undefined) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat().format(num);
  };

  const formatRevenue = (revenue: number | undefined) => {
    if (!revenue) return 'N/A';
    if (revenue >= 1000000000) {
      return `$${(revenue / 1000000000).toFixed(1)}B`;
    }
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    }
    if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(1)}K`;
    }
    return `$${revenue}`;
  };

  const getRevenueColor = (revenue: number | undefined) => {
    if (!revenue) return 'text-gray-500';
    if (revenue >= 1000000000) return 'text-green-700 font-bold';
    if (revenue >= 100000000) return 'text-green-600 font-semibold';
    if (revenue >= 10000000) return 'text-blue-600 font-medium';
    if (revenue >= 1000000) return 'text-blue-500';
    return 'text-gray-600';
  };

  const getLocationDisplay = () => {
    console.log('🏢 Dados completos da empresa para localização:', company);
    
    // 1. PRIORIDADE MÁXIMA: headquarters_address (endereço completo da sede)
    if (company.headquarters_address && company.headquarters_address.trim()) {
      console.log('📍 Localização encontrada em headquarters_address:', company.headquarters_address);
      
      // Se contém vírgulas, tentar extrair cidade e estado
      if (company.headquarters_address.includes(',')) {
        const parts = company.headquarters_address.split(',').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          // Pegar as duas primeiras partes (geralmente cidade, estado)
          const cityState = parts.slice(0, 2).join(', ');
          console.log('📍 Cidade e estado extraídos:', cityState);
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
    
    console.log('📍 Campos de localização encontrados:', { city, state, country });
    
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
      const result = locationParts.join(', ');
      console.log('📍 Localização construída a partir de campos:', result);
      return result;
    }
    
    // 3. ARRAYS DE LOCALIZAÇÃO
    if ((company as any).organization_locations && 
        Array.isArray((company as any).organization_locations) && 
        (company as any).organization_locations.length > 0) {
      const location = (company as any).organization_locations[0];
      console.log('📍 Localização encontrada em organization_locations:', location);
      
      // Se a localização contém vírgulas, tentar extrair cidade e estado
      if (typeof location === 'string' && location.includes(',')) {
        const parts = location.split(',').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          const cityState = parts.slice(0, 2).join(', ');
          console.log('📍 Cidade e estado extraídos de array:', cityState);
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
        console.log(`📍 Localização encontrada em ${field}:`, value);
        
        // Se contém vírgulas, tentar extrair cidade e estado
        if (value.includes(',')) {
          const parts = value.split(',').map(p => p.trim()).filter(p => p);
          if (parts.length >= 2) {
            const cityState = parts.slice(0, 2).join(', ');
            console.log('📍 Cidade e estado extraídos:', cityState);
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
          console.log(`📍 Localização encontrada em ${field}:`, location);
          
          // Se contém vírgulas, tentar extrair cidade e estado
          if (location.includes(',')) {
            const parts = location.split(',').map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
              const cityState = parts.slice(0, 2).join(', ');
              console.log('📍 Cidade e estado extraídos de array:', cityState);
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
        console.log(`📍 Endereço encontrado em ${field}:`, address);
        
        // Tentar extrair cidade e estado do endereço completo
        if (address.includes(',')) {
          const addressParts = address.split(',').map(part => part.trim()).filter(p => p);
          if (addressParts.length >= 2) {
            // Para endereços brasileiros, geralmente cidade vem antes do estado
            const cityState = addressParts.slice(-2).join(', ');
            console.log('📍 Cidade e estado extraídos do endereço:', cityState);
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
        console.log('📍 Inferindo Brasil pelo domínio:', company.primary_domain);
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
          console.log(`📍 Inferindo ${country} pelo domínio:`, company.primary_domain);
          return country;
        }
      }
    }
    
    // 8. BUSCAR PISTAS NO NOME DA EMPRESA
    if (company.name) {
      const brazilianCities = [
        'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
        'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia',
        'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba', 'Osasco',
        'Joinville', 'Uberlândia', 'Contagem', 'Aracaju', 'Feira de Santana',
        'Cuiabá', 'Londrina', 'Juiz de Fora', 'Niterói', 'Belém',
        'Campo Grande', 'São Bernardo do Campo', 'Nova Iguaçu', 'Maceió',
        'São José dos Campos', 'Natal', 'Teresina', 'São João de Meriti'
      ];
      
      const foundCity = brazilianCities.find(city => 
        company.name.toLowerCase().includes(city.toLowerCase())
      );
      
      if (foundCity) {
        console.log('📍 Cidade encontrada no nome da empresa:', foundCity);
        return foundCity + ', Brasil';
      }
      
      // Buscar estados no nome
      const brazilianStates = [
        'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná',
        'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina',
        'Goiás', 'Maranhão', 'Espírito Santo', 'Paraíba', 'Amazonas',
        'Mato Grosso', 'Rio Grande do Norte', 'Alagoas', 'Piauí', 'Distrito Federal'
      ];
      
      const foundState = brazilianStates.find(state => 
        company.name.toLowerCase().includes(state.toLowerCase())
      );
      
      if (foundState) {
        console.log('📍 Estado encontrado no nome da empresa:', foundState);
        return foundState + ', Brasil';
      }
    }
    
    console.log('❌ Nenhuma localização específica encontrada');
    return 'Localização não disponível';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-100 hover:border-blue-200 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {company.logo_url && (
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="w-12 h-12 rounded-lg mr-3 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
            {company.website_url && (
              <a
                href={company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1"
              >
                {company.primary_domain}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
        </div>
        {company.publicly_traded_symbol && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
            {company.publicly_traded_symbol}
          </span>
        )}
      </div>

      {/* Informações principais da empresa - localização e funcionários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Localização */}
        <div className="flex items-center text-gray-600 bg-blue-50 rounded-md px-3 py-2 border border-blue-200 min-h-[3rem]">
          <MapPin className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-700 block truncate">
              {getLocationDisplay()}
            </span>
            <span className="text-xs text-blue-600">Sede da empresa</span>
          </div>
        </div>
        
        {/* Número de funcionários */}
        <div className="flex items-center text-gray-600 bg-green-50 rounded-md px-3 py-2 border border-green-200">
          <Users className="w-4 h-4 mr-2 text-green-500" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-700 block">
              {company.num_employees ? formatNumber(company.num_employees) : 'N/A'} funcionários
            </span>
            <span className="text-xs text-green-600">
              {company.num_employees_range || 'FTEs (Full-Time Employees)'}
            </span>
          </div>
        </div>
      </div>

      {/* Informações secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {company.founded_year && (
          <div className="flex items-center text-gray-600 bg-yellow-50 rounded-md px-3 py-2">
            <Calendar className="w-4 h-4 mr-2 text-yellow-600" />
            <div>
              <span className="text-sm font-medium text-gray-700">Fundada em {company.founded_year}</span>
              <span className="text-xs text-gray-500 block">
                {new Date().getFullYear() - company.founded_year} anos de mercado
              </span>
            </div>
          </div>
        )}
        
        {company.annual_revenue && (
          <div className={`flex items-center bg-green-50 rounded-md px-3 py-2 ${getRevenueColor(company.annual_revenue)}`}>
            <DollarSign className="w-4 h-4 mr-2" />
            <div>
              <span className="text-sm font-medium">Receita: {formatRevenue(company.annual_revenue)}</span>
              <span className="text-xs text-gray-500 block">Receita anual estimada</span>
            </div>
          </div>
        )}
      </div>

      {/* Informações adicionais compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs">
        {company.publicly_traded_symbol && (
          <div className="flex items-center text-gray-600 bg-purple-50 rounded px-2 py-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
            <span className="font-medium">{company.publicly_traded_symbol}</span>
          </div>
        )}
        
        {company.primary_phone?.number && (
          <div className="flex items-center text-gray-600 bg-gray-50 rounded px-2 py-1">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">Telefone</span>
          </div>
        )}
        
        {company.website_url && (
          <div className="flex items-center text-gray-600 bg-blue-50 rounded px-2 py-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
            <span className="truncate">Website</span>
          </div>
        )}
        
        {company.languages && company.languages.length > 0 && (
          <div className="flex items-center text-gray-600 bg-green-50 rounded px-2 py-1">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            <span className="truncate">{company.languages[0]}</span>
          </div>
        )}
      </div>

      {company.industry && (
        <div className="mb-4">
          <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
            {getCorrectBusinessArea()}
          </span>
        </div>
      )}

      {company.keywords && company.keywords.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {company.keywords.slice(0, 5).map((keyword, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs"
              >
                {keyword}
              </span>
            ))}
            {company.keywords.length > 5 && (
              <span className="text-gray-500 text-xs">
                +{company.keywords.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-auto">
        <div className="text-sm text-gray-500">
          ID: {company.id}
        </div>
        <div className="flex flex-col space-y-2 items-end">
          {onSearchPeople && (
            <div className="flex items-center space-x-2 w-full justify-end">
              <button
                onClick={() => {
                  console.log('🚀 Busca Rápida clicada para:', company.name);
                  console.log('🏢 Company data:', { id: company.id, organization_id: company.organization_id });
                  const quickFilters: PeopleSearchFilters = {
                    organizationId: company.organization_id || company.id,
                    personTitles: [], // Remove title restrictions
                    personSeniorities: [], // Remove seniority restrictions
                    personLocations: [],
                    keywords: '',
                    page: 1,
                    perPage: 100, // Aumentar para 100 resultados
                  };
                  console.log('📋 Filtros da busca rápida:', quickFilters);
                  if (onQuickPeopleSearch) {
                    console.log('✅ Executando onQuickPeopleSearch...');
                    onQuickPeopleSearch(company, quickFilters);
                  } else {
                    console.log('❌ onQuickPeopleSearch não está disponível');
                  }
                }}
                className="flex items-center px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors shadow-sm font-medium whitespace-nowrap"
              >
                <Search className="w-3 h-3 mr-1" />
                Busca Rápida
              </button>
            <button
              onClick={() => {
                console.log('🔧 Advanced Search clicado para:', company.name);
                console.log('🏢 Company data completa:', company);
                if (onSearchPeople) {
                  console.log('✅ Executando onSearchPeople...');
                onSearchPeople(company);
                } else {
                  console.log('❌ onSearchPeople não está disponível');
                }
              }}
                className="flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium border border-blue-500 whitespace-nowrap"
            >
                <Users className="w-3 h-3 mr-1" />
                Advanced
            </button>
            </div>
          )}
          <div className="flex items-center space-x-2 text-xs w-full justify-end">
            {company.linkedin_url && (
            <a
              href={company.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
            >
              LinkedIn
            </a>
            )}
            {company.crunchbase_url && (
            <a
              href={company.crunchbase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
            >
              Crunchbase
            </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};