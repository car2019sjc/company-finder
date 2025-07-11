import React from 'react';
import { Filter, Building2, TrendingUp } from 'lucide-react';
import type { Company } from '../types/apollo';

interface IndustryFilterProps {
  companies: Company[];
  selectedIndustries: string[];
  onIndustryChange: (industries: string[]) => void;
  sortBy: 'name' | 'industry' | 'employees' | 'revenue';
  onSortChange: (sortBy: 'name' | 'industry' | 'employees' | 'revenue') => void;
}

export const IndustryFilter: React.FC<IndustryFilterProps> = ({
  companies,
  selectedIndustries,
  onIndustryChange,
  sortBy,
  onSortChange
}) => {
  // Extrair todas as indústrias únicas das empresas
  const industries = React.useMemo(() => {
    const industryMap = new Map<string, number>();
    
    // Mapear indústrias em inglês para português para melhor exibição
    const industryTranslation: { [key: string]: string } = {
      'Agriculture': 'Agronegócio',
      'Agribusiness': 'Agronegócio',
      'Farming': 'Agronegócio',
      'Information Technology': 'Tecnologia',
      'Computer Software': 'Tecnologia',
      'Software Development': 'Tecnologia',
      'Healthcare': 'Saúde',
      'Medical': 'Saúde',
      'Hospital': 'Saúde',
      'Financial Services': 'Finanças',
      'Banking': 'Finanças',
      'Insurance': 'Finanças',
      'Manufacturing': 'Manufatura',
      'Industrial Manufacturing': 'Manufatura',
      'Construction': 'Construção',
      'Real Estate': 'Imobiliário',
      'Education': 'Educação',
      'Retail': 'Varejo',
      'E-commerce': 'E-commerce',
      'Telecommunications': 'Telecomunicações',
      'Energy': 'Energia',
      'Oil & Gas': 'Petróleo e Gás',
      'Mining': 'Mineração',
      'Logistics': 'Logística',
      'Transportation': 'Logística',
      'Food & Beverages': 'Alimentação',
      'Automotive': 'Automotivo',
      'Pharmaceuticals': 'Farmacêutico',
      'Textiles': 'Têxtil',
      'Chemicals': 'Química',
      'Paper & Pulp': 'Papel e Celulose',
      'Management Consulting': 'Consultoria',
      'Professional Services': 'Consultoria',
      'Hospitality': 'Hotelaria',
      'Hotels': 'Hotelaria',
      'Travel': 'Turismo'
    };
    
    companies.forEach(company => {
      if (company.industry) {
        let industry = company.industry.trim();
        
        // Traduzir para português se possível, senão manter original
        const translatedIndustry = industryTranslation[industry] || industry;
        
        industryMap.set(translatedIndustry, (industryMap.get(translatedIndustry) || 0) + 1);
      }
    });
    
    return Array.from(industryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [companies]);

  const handleIndustryToggle = (industry: string) => {
    // Mapear indústrias em inglês para português para filtro
    const industryTranslation: { [key: string]: string } = {
      'Agriculture': 'Agronegócio',
      'Agribusiness': 'Agronegócio',
      'Farming': 'Agronegócio',
      'Information Technology': 'Tecnologia',
      'Computer Software': 'Tecnologia',
      'Software Development': 'Tecnologia',
      'Healthcare': 'Saúde',
      'Medical': 'Saúde',
      'Hospital': 'Saúde',
      'Financial Services': 'Finanças',
      'Banking': 'Finanças',
      'Insurance': 'Finanças',
      'Manufacturing': 'Manufatura',
      'Industrial Manufacturing': 'Manufatura',
      'Construction': 'Construção',
      'Real Estate': 'Imobiliário',
      'Education': 'Educação',
      'Retail': 'Varejo',
      'E-commerce': 'E-commerce',
      'Telecommunications': 'Telecomunicações',
      'Energy': 'Energia',
      'Oil & Gas': 'Petróleo e Gás',
      'Mining': 'Mineração',
      'Logistics': 'Logística',
      'Transportation': 'Logística',
      'Food & Beverages': 'Alimentação',
      'Automotive': 'Automotivo',
      'Pharmaceuticals': 'Farmacêutico',
      'Textiles': 'Têxtil',
      'Chemicals': 'Química',
      'Paper & Pulp': 'Papel e Celulose',
      'Management Consulting': 'Consultoria',
      'Professional Services': 'Consultoria',
      'Hospitality': 'Hotelaria',
      'Hotels': 'Hotelaria',
      'Travel': 'Turismo'
    };
    
    // Aplicar filtro de indústria com mapeamento reverso
    if (selectedIndustries.includes(industry)) {
      onIndustryChange(selectedIndustries.filter(i => i !== industry));
    } else {
      onIndustryChange([...selectedIndustries, industry]);
    }
  };

  const clearAllFilters = () => {
    onIndustryChange([]);
  };

  const selectAllIndustries = () => {
    onIndustryChange(industries.map(i => i.name));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros e Classificação</h3>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Ordenar por Nome</option>
            <option value="industry">Ordenar por Setor</option>
            <option value="employees">Ordenar por Funcionários</option>
            <option value="revenue">Ordenar por Receita 💰</option>
          </select>
        </div>
      </div>

      {industries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Building2 className="w-4 h-4 mr-1" />
              Setores de Negócio ({industries.length})
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={selectAllIndustries}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Selecionar Todos
              </button>
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {industries.map(({ name, count }) => (
              <label
                key={name}
                className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedIndustries.includes(name)}
                  onChange={() => handleIndustryToggle(name)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-900 truncate block">{name}</span>
                  <span className="text-xs text-gray-500">{count} empresa{count !== 1 ? 's' : ''}</span>
                </div>
              </label>
            ))}
          </div>

          {selectedIndustries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedIndustries.length} setor{selectedIndustries.length !== 1 ? 'es' : ''} selecionado{selectedIndustries.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center text-sm text-blue-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {companies.filter(c => {
                    // Mapear indústrias em inglês para português para filtro
                    const industryTranslation: { [key: string]: string } = {
                      'Agriculture': 'Agronegócio',
                      'Agribusiness': 'Agronegócio',
                      'Farming': 'Agronegócio',
                      'Information Technology': 'Tecnologia',
                      'Computer Software': 'Tecnologia',
                      'Software Development': 'Tecnologia',
                      'Healthcare': 'Saúde',
                      'Medical': 'Saúde',
                      'Hospital': 'Saúde',
                      'Financial Services': 'Finanças',
                      'Banking': 'Finanças',
                      'Insurance': 'Finanças',
                      'Manufacturing': 'Manufatura',
                      'Industrial Manufacturing': 'Manufatura',
                      'Construction': 'Construção',
                      'Real Estate': 'Imobiliário',
                      'Education': 'Educação',
                      'Retail': 'Varejo',
                      'E-commerce': 'E-commerce',
                      'Telecommunications': 'Telecomunicações',
                      'Energy': 'Energia',
                      'Oil & Gas': 'Petróleo e Gás',
                      'Mining': 'Mineração',
                      'Logistics': 'Logística',
                      'Transportation': 'Logística',
                      'Food & Beverages': 'Alimentação',
                      'Automotive': 'Automotivo',
                      'Pharmaceuticals': 'Farmacêutico',
                      'Textiles': 'Têxtil',
                      'Chemicals': 'Química',
                      'Paper & Pulp': 'Papel e Celulose',
                      'Management Consulting': 'Consultoria',
                      'Professional Services': 'Consultoria',
                      'Hospitality': 'Hotelaria',
                      'Hotels': 'Hotelaria',
                      'Travel': 'Turismo'
                    };
                    
                    return c.industry && (
                      selectedIndustries.includes(c.industry) ||
                      selectedIndustries.includes(industryTranslation[c.industry] || '')
                    );
                  }).length} empresas
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedIndustries.slice(0, 5).map(industry => (
                  <span
                    key={industry}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {industry}
                    <button
                      onClick={() => handleIndustryToggle(industry)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedIndustries.length > 5 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{selectedIndustries.length - 5} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};