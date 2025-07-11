import React from 'react';
import { ExternalLink, MapPin, Users, Calendar, DollarSign, Search } from 'lucide-react';
import type { Company, PeopleSearchFilters } from '../types/apollo';
import axios from 'axios';
import { useState } from 'react';

interface CompanyCardProps {
  company: Company;
  onSearchPeople?: (company: Company) => void;
  onQuickPeopleSearch?: (company: Company, filters: PeopleSearchFilters) => void;
  breadcrumbs?: any[];
  sectorFilter?: string;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onSearchPeople, onQuickPeopleSearch, breadcrumbs, sectorFilter }) => {
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

  const [linkedinEmployees, setLinkedinEmployees] = useState<string | null>(null);
  const [loadingLinkedin, setLoadingLinkedin] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  async function fetchEmployeesFromWebsite(websiteUrl: string): Promise<string | null> {
    setLoadingLinkedin(true);
    setLinkedinError(null);
    try {
      const prompt = `Acesse o site oficial da empresa: ${websiteUrl}\nProcure por qualquer menção ao número de funcionários, colaboradores, equipe, ou tamanho da empresa.\nVerifique se há informações em seções como “Sobre”, “Quem Somos”, “Nossa Equipe”, rodapé, página institucional, ou relatórios anuais.\nSe encontrar um número exato ou uma faixa (ex: “mais de 200 funcionários”, “51-200 funcionários”, “time de 50 pessoas”, etc), responda apenas com esse número ou faixa, sem texto adicional.\nSe não encontrar, responda apenas com “N/A”.`;
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 20,
          temperature: 0,
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const text = response.data.choices[0].message.content.trim();
      setLinkedinEmployees(text.match(/\d+/) ? text : null);
      if (!text.match(/\d+/)) setLinkedinError('Não foi possível extrair o número do site.');
      setLoadingLinkedin(false);
      return text.match(/\d+/) ? text : null;
    } catch (err: any) {
      setLinkedinError('Erro ao buscar no site via OpenAI.');
      setLoadingLinkedin(false);
      return null;
    }
  }

  const [googleEmployees, setGoogleEmployees] = useState<string | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function fetchEmployeesFromGoogle(companyName: string, websiteUrl?: string): Promise<string | null> {
    setLoadingGoogle(true);
    setGoogleError(null);
    try {
      const prompt = `Você é um assistente inteligente especializado em análise de empresas brasileiras.\n\nObjetivo: Estimar a quantidade de funcionários de uma empresa brasileira específica, com base nas informações públicas disponíveis.\n\nEmpresa a ser analisada: ${companyName}${websiteUrl ? ` (${websiteUrl})` : ''}\n\nTarefas:\n1. Pesquise fontes públicas confiáveis como o site oficial da empresa, LinkedIn, relatórios institucionais, reportagens e órgãos de imprensa.\n2. Indique as fontes utilizadas, com o link completo (se possível).\n3. Caso não exista um número exato, forneça uma estimativa baseada nas faixas mencionadas (ex: “entre 200 e 500”, “mais de 1000”).\n4. Priorize dados atualizados (2024 ou 2025, se disponível).\n5. Escreva um resumo claro e direto com a informação mais confiável e atual possível.\n\nFormato de resposta:\n- Nome da empresa: [Nome]\n- Nº estimado de funcionários: [ex: ~600]\n- Fontes encontradas:\n  • [Fonte 1 com link]\n  • [Fonte 2 com link]\n- Observações adicionais (se houver): [Texto livre]`;
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0,
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const text = response.data.choices[0].message.content.trim();
      // Extrair apenas a quantidade/faixa de funcionários
      const match = text.match(/N[ºo]* estimado de funcionários:\s*([^\n]+)/i);
      const onlyEmployees = match ? match[1].trim() : null;
      setGoogleEmployees(onlyEmployees);
      if (!onlyEmployees) setGoogleError('Não foi possível extrair o número do Google.');
      setLoadingGoogle(false);
      return onlyEmployees;
    } catch (err: any) {
      setGoogleError('Erro ao buscar no Google via OpenAI.');
      setLoadingGoogle(false);
      return null;
    }
  }

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
      {/* Remover bloco de localização */}
      {/* Remover bloco de links rápidos/idiomas */}
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
        {/* Setor da empresa ao lado do bloco de fundação */}
        
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
      {/* Remover bloco de links rápidos/idiomas */}
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

      {/* Botões de busca centralizados, acima do ID/LinkedIn */}
      <div className="flex items-center justify-center w-full mt-4 mb-2">
        {onSearchPeople && (
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
        )}
      </div>

      {/* Linha discreta com ID e LinkedIn */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-auto text-xs text-gray-500">
        <div>ID: {company.id}</div>
        <div>
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
        </div>
      </div>
    </div>
  );
};