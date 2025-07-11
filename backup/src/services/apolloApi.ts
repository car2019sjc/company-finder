import type { SearchResponse, SearchFilters, ApiError } from '../types/apollo';
import type { PeopleSearchResponse, PeopleSearchFilters, EmailSearchResponse, EmailSearchFilters } from '../types/apollo';

const API_BASE_URL = '/api/apollo/v1';

class ApolloApiError extends Error {
  public status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApolloApiError';
    this.status = status;
  }
}

class ApolloApiService {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('API key is required. Please enter your Apollo.io API key.');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the status-based message
          if (response.status === 401) {
            errorMessage = 'Invalid API key. Please check your Apollo.io API key.';
          } else if (response.status === 403) {
            errorMessage = 'Access denied. Please ensure your Apollo.io plan includes API access.';
          } else if (response.status === 422) {
            errorMessage = 'Invalid search parameters. Please check your search criteria and try again.';
          } else if (response.status === 429) {
            errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
          }
        }
        
        const error: ApiError = {
          message: errorMessage,
          status: response.status,
        };
        throw new ApolloApiError(errorMessage, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to Apollo.io API. Please check your internet connection.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while making the request.');
    }
  }

  async searchCompanies(filters: SearchFilters): Promise<SearchResponse> {
    // Construir o corpo da requisição seguindo a documentação da API Apollo
    const body: any = {
      page: filters.page || 1,
      per_page: filters.perPage || 25,
    };

    // Nome da empresa - usar q_organization_name
    if (filters.companyName && filters.companyName.trim()) {
      body.q_organization_name = filters.companyName.trim();
    }

    // Localização - usar organization_locations como array
    if (filters.location && filters.location.trim()) {
      body.organization_locations = [filters.location.trim()];
    }

    // Área de negócio - usar q_organization_keyword_tags
    if (filters.businessArea && filters.businessArea.trim()) {
      // Mapa de tradução mais específico baseado na documentação Apollo
      const businessAreaMap: { [key: string]: string } = {
        // Tecnologia
        'Tecnologia': 'technology',
        'Tecnologia e TI': 'technology',
        'TI': 'information technology',
        'Software': 'computer software',
        'Desenvolvimento': 'software development',
        
        // Saúde
        'Saúde': 'healthcare',
        'Medicina': 'medical practice',
        'Hospital': 'hospital health care',
        'Clínica': 'medical practice',
        'Farmácia': 'pharmaceuticals',
        
        // Finanças
        'Finanças': 'financial services',
        'Financeiro': 'financial services',
        'Banco': 'banking',
        'Bancário': 'banking',
        'Seguro': 'insurance',
        'Investimento': 'investment management',
        
        // Educação
        'Educação': 'education management',
        'Ensino': 'education management',
        'Escola': 'primary secondary education',
        'Universidade': 'higher education',
        
        // Varejo
        'Varejo': 'retail',
        'Comércio': 'retail',
        'E-commerce': 'internet',
        'Loja': 'retail',
        
        // Indústria
        'Indústria': 'manufacturing',
        'Manufatura': 'manufacturing',
        'Industrial': 'industrial automation',
        'Fábrica': 'manufacturing',
        
        // Consultoria
        'Consultoria': 'management consulting',
        'Consultoria Empresarial': 'management consulting',
        
        // Construção e Imobiliário
        'Construção': 'construction',
        'Imobiliário': 'real estate',
        'Arquitetura': 'architecture planning',
        'Engenharia': 'civil engineering',
        
        // Mídia e Comunicação
        'Mídia': 'media production',
        'Marketing': 'marketing advertising',
        'Publicidade': 'marketing advertising',
        'Comunicação': 'public relations communications',
        
        // Transporte e Logística
        'Logística': 'logistics supply chain',
        'Transporte': 'transportation trucking railroad',
        'Frete': 'logistics supply chain',
        
        // Energia
        'Energia': 'utilities',
        'Petróleo': 'oil energy',
        'Gás': 'oil energy',
        'Energia Solar': 'renewables environment',
        
        // Agronegócio
        'Agronegócio': 'farming',
        'Agricultura': 'farming',
        'Pecuária': 'farming',
        'Rural': 'farming',
        
        // Turismo
        'Turismo': 'leisure travel tourism',
        'Hotel': 'hospitality',
        'Hotelaria': 'hospitality',
        'Hospitalidade': 'hospitality',
        
        // Automotivo
        'Automotivo': 'automotive',
        'Automobilístico': 'automotive',
        'Automóveis': 'automotive',
        
        // Farmacêutico
        'Farmacêutico': 'pharmaceuticals',
        
        // Entretenimento
        'Entretenimento': 'entertainment',
        'Cultura': 'museums institutions',
        
        // Telecomunicações
        'Telecomunicações': 'telecommunications',
        'Telecom': 'telecommunications',
        
        // Mineração
        'Mineração': 'mining metals',
        
        // Química
        'Química': 'chemicals',
        
        // Têxtil
        'Têxtil': 'textiles',
        
        // Alimentação
        'Alimentação': 'food beverages',
        'Alimentos': 'food production',
        'Bebidas': 'food beverages',
        'Restaurante': 'restaurants'
      };
      
      const translatedBusinessArea = businessAreaMap[filters.businessArea] || 
                                   businessAreaMap[filters.businessArea.toLowerCase()] || 
                                   filters.businessArea.toLowerCase();
      
      console.log(`🔄 Traduzindo "${filters.businessArea}" para "${translatedBusinessArea}"`);
      body.q_organization_keyword_tags = [translatedBusinessArea];
    }

    // Faixa de funcionários - usar organization_num_employees_ranges
    if (filters.employeeRange && filters.employeeRange !== 'all') {
      const [min, max] = filters.employeeRange.split(',');
      if (min && max) {
        body.organization_num_employees_ranges = [`${min},${max}`];
      }
    }

    console.log('📡 Enviando requisição para Apollo API:', body);

    // Tentar primeiro o endpoint mixed_companies/search
    let response: SearchResponse;
    try {
      response = await this.makeRequest<SearchResponse>('/mixed_companies/search', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      console.log('📥 Resposta da API (mixed_companies):', response);
    } catch (error) {
      console.log('⚠️ Erro em mixed_companies, tentando organizations/search...');
      
      // Fallback para organizations/search
      try {
        response = await this.makeRequest<SearchResponse>('/organizations/search', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        console.log('📥 Resposta da API (organizations):', response);
      } catch (fallbackError) {
        console.log('❌ Erro também em organizations/search, tentando busca simplificada...');
        
        // Última tentativa: busca muito simplificada
        const simplifiedBody: any = {
          page: 1,
          per_page: 25,
        };
        
        // Apenas localização se disponível
        if (filters.location && filters.location.trim()) {
          simplifiedBody.organization_locations = [filters.location.trim()];
        }
        
        // Ou apenas nome da empresa se disponível
        if (!filters.location && filters.companyName && filters.companyName.trim()) {
          simplifiedBody.q_organization_name = filters.companyName.trim();
        }
        
        console.log('📡 Tentativa simplificada:', simplifiedBody);
        
        try {
          response = await this.makeRequest<SearchResponse>('/organizations/search', {
            method: 'POST',
            body: JSON.stringify(simplifiedBody),
          });
          console.log('📥 Resposta da busca simplificada:', response);
        } catch (finalError) {
          console.error('❌ Todas as tentativas falharam');
          throw error; // Throw original error
        }
      }
    }

    // Normalizar a resposta para garantir estrutura esperada
    let companies = response.organizations || (response as any).companies || [];
    console.log('🏢 Empresas encontradas:', companies.length);
    
    // Se organizations está vazio mas temos total_entries, tentar outros campos possíveis
    if ((!companies || companies.length === 0) && response.pagination?.total_entries > 0) {
      console.log('🔄 Tentando encontrar empresas em outros campos da resposta...');
      const possibleFields = ['results', 'data', 'items', 'records', 'accounts', 'entries'];
      for (const field of possibleFields) {
        if (response[field] && Array.isArray(response[field]) && response[field].length > 0) {
          console.log(`✅ Empresas encontradas no campo: ${field}`);
          companies = response[field];
          break;
        }
      }
    }
    
    const normalizedResponse: SearchResponse = {
      organizations: Array.isArray(companies) ? companies : [],
      breadcrumbs: response.breadcrumbs || [],
      partial_results_only: response.partial_results_only || false,
      disable_eu_prospecting: response.disable_eu_prospecting || false,
      num_fetch_result: response.num_fetch_result || 0,
      pagination: {
        page: response.pagination?.page || 1,
        per_page: response.pagination?.per_page || 25,
        total_entries: response.pagination?.total_entries || 0,
        total_pages: response.pagination?.total_pages || 0,
      }
    };

    console.log('📊 Resposta normalizada:', normalizedResponse);
    
    return normalizedResponse;
  }

  async searchPeople(filters: PeopleSearchFilters): Promise<PeopleSearchResponse> {
    console.log('🔍 Apollo API - searchPeople iniciado com filtros:', filters);
    
    // Primeiro, vamos tentar uma busca mais ampla se não encontrarmos resultados
    let response = await this.attemptPeopleSearch(filters);
    
    // Se não encontrou resultados, tentar busca alternativa
    if ((!response.contacts || response.contacts.length === 0) && 
        (!response.people || response.people.length === 0)) {
      console.log('⚠️ Primeira busca não retornou resultados, tentando busca alternativa...');
      response = await this.attemptAlternativePeopleSearch(filters);
    }
    
    return this.normalizePeopleResponse(response);
  }

  private async attemptPeopleSearch(filters: PeopleSearchFilters): Promise<any> {
    console.log('🔍 Apollo API - searchPeople iniciado com filtros:', filters);
    
    // Configuração otimizada para busca de pessoas
    const body: any = {
      page: filters.page,
      per_page: filters.perPage || 100, // Usar 100 como padrão
    };

    // Configurações essenciais da API Apollo
    body.reveal_personal_emails = true;
    body.include_emails = true;
    body.prospected_by_current_team = false;

    if (filters.organizationId) {
      body.organization_ids = [filters.organizationId];
      console.log('🏢 Organização ID adicionado:', filters.organizationId);
    }

    // ESTRATÉGIA CORRIGIDA: Usar apenas person_titles para busca inicial
    if (filters.personTitles && filters.personTitles.length > 0) {
      body.person_titles = filters.personTitles;
      console.log('👔 Títulos adicionados:', filters.personTitles);
    }

    if (filters.personSeniorities && filters.personSeniorities.length > 0) {
      body.person_seniorities = filters.personSeniorities;
      console.log('📊 Senioridades adicionadas:', filters.personSeniorities);
    }

    if (filters.personLocations && filters.personLocations.length > 0) {
      body.person_locations = filters.personLocations;
      console.log('📍 Localizações adicionadas:', filters.personLocations);
    }

    if (filters.keywords && filters.keywords.trim()) {
      body.q_keywords = filters.keywords.trim();
      console.log('🔤 Keywords adicionadas:', filters.keywords.trim());
    }

    console.log('📡 Body da requisição people search:', body);

    try {
      const response = await this.makeRequest<any>('/mixed_people/search', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      console.log('📥 Resposta bruta da API people search:', response);
      
      return response;
    } catch (error) {
      console.log('❌ Erro em mixed_people/search, tentando contacts/search...');
      
      // Fallback para contacts/search
      try {
        const fallbackResponse = await this.makeRequest<any>('/contacts/search', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        
        console.log('📥 Resposta fallback contacts/search:', fallbackResponse);
        
        return fallbackResponse;
      } catch (fallbackError) {
        console.log('❌ Erro também em contacts/search:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  private async attemptAlternativePeopleSearch(filters: PeopleSearchFilters): Promise<any> {
    console.log('🔄 Tentando busca alternativa de pessoas...');
    
    // Busca alternativa mais ampla
    const broadBody: any = {
      page: 1,
      per_page: 100,
      reveal_personal_emails: true,
      include_emails: true,
    };

    if (filters.organizationId) {
      broadBody.organization_ids = [filters.organizationId];
    }
    
    // Manter filtros de título na busca alternativa
    if (filters.personTitles && filters.personTitles.length > 0) {
      broadBody.person_titles = filters.personTitles;
    }

    console.log('📡 Body da busca alternativa:', broadBody);

    try {
      const response = await this.makeRequest<any>('/people/search', {
        method: 'POST',
        body: JSON.stringify(broadBody),
      });
      
      console.log('📥 Resposta da busca alternativa:', response);
      
      return response;
    } catch (error) {
      console.log('❌ Erro na busca alternativa:', error);
      
      // Última tentativa: busca por organização usando endpoint diferente
      try {
        const orgBody = {
          organization_id: filters.organizationId,
          page: 1,
          per_page: 100,
        };
        
        const orgResponse = await this.makeRequest<any>('/organizations/people', {
          method: 'POST',
          body: JSON.stringify(orgBody),
        });
        
        console.log('📥 Resposta organizations/people:', orgResponse);
        
        return orgResponse;
      } catch (orgError) {
        console.log('❌ Erro em organizations/people:', orgError);
        
        // Retornar resposta vazia mas válida
        return {
          contacts: [],
          people: [],
          pagination: {
            page: 1,
            per_page: 25,
            total_entries: 0,
            total_pages: 0,
          }
        };
      }
    }
  }

  private normalizePeopleResponse(response: any): PeopleSearchResponse {
    console.log('🔄 Normalizando resposta de pessoas...');
    console.log('📊 Resposta bruta recebida:', response);
    
    // Try to find people data in different possible fields
    let peopleData = [];
    if (response.contacts && Array.isArray(response.contacts) && response.contacts.length > 0) {
      peopleData = response.contacts;
      console.log('👥 Pessoas encontradas em contacts:', peopleData.length);
    } else if (response.people && Array.isArray(response.people) && response.people.length > 0) {
      peopleData = response.people;
      console.log('👥 Pessoas encontradas em people:', peopleData.length);
    } else if (response.results && Array.isArray(response.results) && response.results.length > 0) {
      peopleData = response.results;
      console.log('👥 Pessoas encontradas em results:', peopleData.length);
    } else {
      // Check for other possible field names
      const possibleFields = ['data', 'persons', 'employees', 'members', 'team'];
      for (const field of possibleFields) {
        if (response[field] && Array.isArray(response[field]) && response[field].length > 0) {
          peopleData = response[field];
          console.log(`👥 Pessoas encontradas em ${field}:`, peopleData.length);
          break;
        }
      }
    }

    const normalizedResponse: PeopleSearchResponse = {
      contacts: peopleData,
      people: peopleData, // For backward compatibility
      breadcrumbs: response.breadcrumbs || [],
      partial_results_only: response.partial_results_only || false,
      disable_eu_prospecting: response.disable_eu_prospecting || false,
      num_fetch_result: response.num_fetch_result || peopleData.length,
      pagination: {
        page: response.pagination?.page || 1,
        per_page: response.pagination?.per_page || 25,
        total_entries: response.pagination?.total_entries || peopleData.length,
        total_pages: response.pagination?.total_pages || (peopleData.length > 0 ? 1 : 0),
      },
      model_ids: response.model_ids || [],
      derived_params: response.derived_params || null
    };

    console.log('📊 Resposta normalizada people search:', normalizedResponse);
    console.log('👥 Total de pessoas na resposta final:', peopleData.length);
    
    // Log detalhado das pessoas encontradas
    if (peopleData.length > 0) {
      console.log('👥 Pessoas encontradas:');
      peopleData.slice(0, 10).forEach((person: any, index: number) => {
        console.log(`  ${index + 1}. ${person.name} - ${person.title || 'Sem título'}`);
      });
      if (peopleData.length > 10) {
        console.log(`  ... e mais ${peopleData.length - 10} pessoas`);
      }
    }

    return normalizedResponse;
  }

  async searchPersonEmails(filters: EmailSearchFilters): Promise<EmailSearchResponse> {
    console.log(`🔍 Apollo API - searchPersonEmails para ID: ${filters.personId}`);
    console.log(`🏢 Organization ID: ${filters.organizationId}`);

    // CRITICAL: Validação inicial para evitar crashes
    if (!filters.personId || filters.personId.trim() === '') {
      console.error('❌ ID da pessoa é obrigatório');
      return {
        person: { id: 'invalid', name: 'Invalid ID', title: 'N/A' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ ID da pessoa é obrigatório para buscar emails'
      };
    }

    // CRITICAL: Validação da API key
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.error('❌ API key é obrigatória');
      return {
        person: { id: filters.personId, name: 'API Key Missing', title: 'N/A' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ API key é obrigatória para buscar emails'
      };
    }

    let finalResponse: EmailSearchResponse;

    // Strategy 1: Use POST people/match with query parameters (safest approach)
    try {
      console.log('📡 Strategy 1: POST people/match com query parameters');
      const body: any = {
        id: filters.personId.toString().trim()
      };

      if (filters.organizationId) {
        body.organization_id = filters.organizationId.toString().trim();
      }

      console.log('📋 Body da requisição people/match:', body);

      const queryParams = new URLSearchParams({
        reveal_personal_emails: 'false', // Start conservative
        reveal_phone_number: 'false'     // Start conservative
      });

      // CRITICAL: Wrap in try-catch to prevent crashes
      let response: any;
      try {
        response = await Promise.race([
          this.makeRequest<any>(`/people/match?${queryParams.toString()}`, {
            method: 'POST',
            body: JSON.stringify(body),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Requisição demorou mais de 30 segundos')), 30000)
          )
        ]);
      } catch (requestError) {
        console.log('❌ Strategy 1 - Erro na requisição:', requestError);
        throw requestError; // Re-throw to be caught by outer try-catch
      }

      console.log('✅ Strategy 1 - Resposta recebida:', response);
      
      if (response && (response.person || response.id)) {
        const personData = response.person || response;
        
        // Aplicar estratégia de extração de emails com 6 campos
        const extractedEmails = this.extractEmailsFromPerson(personData);
        const phoneNumbers = personData.phone_numbers || [];

        console.log(`📧 Strategy 1 - Emails extraídos: ${extractedEmails.length}`);
        console.log(`📞 Strategy 1 - Telefones encontrados: ${phoneNumbers.length}`);

        const successResponse = {
          person: personData,
          emails: extractedEmails,
          phone_numbers: Array.isArray(phoneNumbers) ? phoneNumbers : [],
          success: true,
          message: `✅ Strategy 1 sucesso: ${extractedEmails.length} email(s), ${phoneNumbers.length} telefone(s)`
        };
        
        console.log('📤 Strategy 1 - Retornando resposta de sucesso');
        finalResponse = successResponse;
        
        return finalResponse;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.log('❌ Strategy 1 falhou:', errorMsg);
      
      // Don't crash on network errors
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('connection')) {
        console.log('🌐 Erro de rede detectado, continuando para próxima strategy...');
      }
    }

    // Strategy 2: Simplified POST people/match
    try {
      console.log('📡 Strategy 2: POST people/match simplificado');
      const body: any = {
        id: filters.personId.toString().trim(),
        reveal_personal_emails: false, // Conservative approach
        reveal_phone_number: false
      };

      console.log('📋 Body simplificado:', body);

      // CRITICAL: Wrap in try-catch to prevent crashes
      let response: any;
      try {
        response = await Promise.race([
          this.makeRequest<any>('/people/match', {
            method: 'POST',
            body: JSON.stringify(body),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Requisição demorou mais de 30 segundos')), 30000)
          )
        ]);
      } catch (requestError) {
        console.log('❌ Strategy 2 - Erro na requisição:', requestError);
        throw requestError; // Re-throw to be caught by outer try-catch
      }

      console.log('✅ Strategy 2 - Resposta recebida:', response);
      
      if (response && (response.person || response.id)) {
        const personData = response.person || response;
        
        // Aplicar estratégia de extração de emails com 6 campos
        const extractedEmails = this.extractEmailsFromPerson(personData);
        const phoneNumbers = personData.phone_numbers || [];

        const successResponse = {
          person: personData,
          emails: extractedEmails,
          phone_numbers: Array.isArray(phoneNumbers) ? phoneNumbers : [],
          success: true,
          message: `✅ Strategy 2 sucesso: ${extractedEmails.length} email(s), ${phoneNumbers.length} telefone(s)`
        };
        
        console.log('📤 Strategy 2 - Retornando resposta de sucesso');
        finalResponse = successResponse;
        
        return finalResponse;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.log('❌ Strategy 2 falhou:', errorMsg);
    }

    // Strategy 3: GET people/{id} (read-only, safer)
    try {
      console.log('📡 Strategy 3: GET people/{id}');
      
      // CRITICAL: Wrap in try-catch to prevent crashes
      let response: any;
      try {
        response = await Promise.race([
          this.makeRequest<any>(`/people/${filters.personId}`, {
            method: 'GET',
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Requisição demorou mais de 30 segundos')), 30000)
          )
        ]);
      } catch (requestError) {
        console.log('❌ Strategy 3 - Erro na requisição:', requestError);
        throw requestError; // Re-throw to be caught by outer try-catch
      }

      console.log('✅ Strategy 3 - Resposta recebida:', response);
      
      if (response && (response.person || response.id)) {
        const personData = response.person || response;
        
        // Aplicar estratégia de extração de emails com 6 campos
        const extractedEmails = this.extractEmailsFromPerson(personData);
        const phoneNumbers = personData.phone_numbers || [];

        const successResponse = {
          person: personData,
          emails: extractedEmails,
          phone_numbers: Array.isArray(phoneNumbers) ? phoneNumbers : [],
          success: true,
          message: `✅ Strategy 3 sucesso: ${extractedEmails.length} email(s), ${phoneNumbers.length} telefone(s)`
        };
        
        console.log('📤 Strategy 3 - Retornando resposta de sucesso');
        finalResponse = successResponse;
        
        return finalResponse;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.log('❌ Strategy 3 falhou:', errorMsg);
    }

    // CRITICAL: Fallback seguro para prevenir crash do app
    console.log(`❌ Todas as strategies falharam para ID: ${filters.personId}`);
    
    finalResponse = {
      person: { 
        id: filters.personId, 
        name: 'Pessoa não encontrada', 
        title: 'N/A',
        email: undefined
      } as any,
      emails: [],
      phone_numbers: [],
      success: false,
      message: `❌ Não foi possível encontrar dados para o ID ${filters.personId}.\n\nPossíveis causas:\n• ID inválido ou pessoa não encontrada\n• Problemas de conectividade\n• Limitações do plano Apollo.io\n• Timeout na requisição\n\nTente novamente em alguns segundos.`
    };
    
    console.log('📤 Retornando resposta segura de fallback');
    return finalResponse;
  }

  // CRITICAL: Método para extrair emails seguindo a estratégia de 6 campos (com proteção contra crashes)
  private extractEmailsFromPerson(person: any): Array<{
    email: string;
    email_status: string;
    email_source?: string;
    position: number;
    free_domain?: boolean;
    confidence?: number;
  }> {
    console.log('🔍 Iniciando extração de emails com estratégia de 6 campos');
    
    // CRITICAL: Validação inicial para evitar crashes
    if (!person || typeof person !== 'object') {
      console.error('❌ Dados da pessoa são inválidos para extração de emails');
      return [];
    }
    
    console.log('👤 Dados da pessoa para extração:', {
      id: person.id,
      name: person.name,
      hasEmail: !!person.email,
      hasContactEmails: !!(person.contact_emails && person.contact_emails.length > 0),
      hasPersonalEmails: !!(person.personal_emails && person.personal_emails.length > 0)
    });
    
    const extractedEmails: Array<{
      email: string;
      email_status: string;
      email_source?: string;
      position: number;
      free_domain?: boolean;
      confidence?: number;
    }> = [];
    
    let rawEmail: string | null = null;
    let emailSource = 'unknown';
    let emailStatus = 'guessed';
    let confidence = 0;

    try {
      // 1. Email direto
      if (person.email && 
          typeof person.email === 'string' && 
          person.email.includes('@') && 
          !person.email.includes('email_not_unlocked')) {
        rawEmail = person.email;
        emailSource = 'direct_email';
        emailStatus = 'verified';
        confidence = 95;
        console.log('✅ Email encontrado em: direct email');
      }

      // 2. Personal emails array
      else if (person.personal_emails && 
               Array.isArray(person.personal_emails) && 
               person.personal_emails.length > 0) {
        const personalEmail = person.personal_emails[0]?.email;
        if (personalEmail && 
            typeof personalEmail === 'string' && 
            personalEmail.includes('@') && 
            !personalEmail.includes('email_not_unlocked')) {
          rawEmail = personalEmail;
          emailSource = 'personal_emails';
          emailStatus = person.personal_emails[0]?.email_status || 'verified';
          confidence = 90;
          console.log('✅ Email encontrado em: personal_emails');
        }
      }

      // 3. Contact emails array
      else if (person.contact_emails && 
               Array.isArray(person.contact_emails) && 
               person.contact_emails.length > 0) {
        const contactEmail = person.contact_emails[0]?.email;
        if (contactEmail && 
            typeof contactEmail === 'string' && 
            contactEmail.includes('@') && 
            !contactEmail.includes('email_not_unlocked')) {
          rawEmail = contactEmail;
          emailSource = 'contact_emails';
          emailStatus = person.contact_emails[0]?.email_status || 'verified';
          confidence = 85;
          console.log('✅ Email encontrado em: contact_emails');
        }
      }

      // 4. Work email
      else if (person.work_email && 
               typeof person.work_email === 'string' && 
               person.work_email.includes('@') && 
               !person.work_email.includes('email_not_unlocked')) {
        rawEmail = person.work_email;
        emailSource = 'work_email';
        emailStatus = 'verified';
        confidence = 80;
        console.log('✅ Email encontrado em: work_email');
      }

      // 5. Extrapolated email
      else if (person.extrapolated_email && 
               typeof person.extrapolated_email === 'string' && 
               person.extrapolated_email.includes('@') && 
               !person.extrapolated_email.includes('email_not_unlocked')) {
        rawEmail = person.extrapolated_email;
        emailSource = 'extrapolated_email';
        emailStatus = 'guessed';
        confidence = person.extrapolated_email_confidence || 70;
        console.log('✅ Email encontrado em: extrapolated_email');
      }

      // 6. Outros campos possíveis
      else {
        const otherFields = ['business_email', 'primary_email', 'verified_email', 'professional_email'];
        for (const field of otherFields) {
          if (person[field] && 
              typeof person[field] === 'string' && 
              person[field].includes('@') && 
              !person[field].includes('email_not_unlocked')) {
            rawEmail = person[field];
            emailSource = field;
            emailStatus = field.includes('verified') ? 'verified' : 'guessed';
            confidence = field.includes('verified') ? 85 : 60;
            console.log(`✅ Email encontrado em: ${field}`);
            break;
          }
        }
      }
    } catch (extractionError) {
      console.error('❌ Erro durante extração de email principal:', extractionError);
      // Continue with safe fallback
    }

    // Se encontrou um email, adicionar à lista
    if (rawEmail) {
      try {
        // Verificar se é domínio gratuito
        const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com'];
        const domain = rawEmail.split('@')[1]?.toLowerCase();
        const isFree = freeDomains.includes(domain || '');

        extractedEmails.push({
          email: rawEmail,
          email_status: emailStatus,
          email_source: emailSource,
          position: 1,
          free_domain: isFree,
          confidence: confidence
        });

        console.log(`📧 Email extraído: ${rawEmail} (fonte: ${emailSource}, status: ${emailStatus}, confiança: ${confidence}%)`);
      } catch (emailProcessingError) {
        console.error('❌ Erro ao processar email principal:', emailProcessingError);
      }
    }

    // CRITICAL: Tentar extrair emails adicionais de arrays (com proteção contra crashes)
    try {
      const emailArrays = [
        { field: 'contact_emails', source: 'contact_emails' },
        { field: 'personal_emails', source: 'personal_emails' },
        { field: 'work_emails', source: 'work_emails' },
        { field: 'business_emails', source: 'business_emails' }
      ];

      for (const { field, source } of emailArrays) {
        if (person[field] && Array.isArray(person[field])) {
          person[field].forEach((emailObj: any, index: number) => {
            try {
              const email = emailObj?.email || emailObj;
              if (email && 
                  typeof email === 'string' && 
                  email.includes('@') && 
                  !email.includes('email_not_unlocked') &&
                  !extractedEmails.some(e => e.email === email)) {
                
                const domain = email.split('@')[1]?.toLowerCase();
                const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com'];
                const isFree = freeDomains.includes(domain || '');

                extractedEmails.push({
                  email: email,
                  email_status: emailObj?.email_status || 'guessed',
                  email_source: source,
                  position: index + 2,
                  free_domain: isFree,
                  confidence: emailObj?.confidence || 70
                });

                console.log(`📧 Email adicional extraído: ${email} (fonte: ${source})`);
              }
            } catch (emailItemError) {
              console.error(`❌ Erro ao processar email do array ${field}[${index}]:`, emailItemError);
            }
          });
        }
      }
    } catch (arrayProcessingError) {
      console.error('❌ Erro ao processar arrays de emails:', arrayProcessingError);
    }

    console.log(`📊 Total de emails extraídos: ${extractedEmails.length}`);
    
    return extractedEmails;
  }
}

export const apolloApiService = new ApolloApiService();