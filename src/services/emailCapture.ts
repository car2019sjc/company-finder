import type { Person, EmailSearchResponse } from '../types/apollo';

// Delay function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Apollo Email Capture Class following the provided instructions
class ApolloEmailCapture {
  private apiKey: string;
  private baseURL: string = '/api/apollo/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Tratamento de erros específicos
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key for email search.');
      } else if (response.status === 403) {
        throw new Error('Email search requires a premium Apollo.io plan.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded for email search.');
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Método para extrair emails seguindo a estratégia de 6 campos
  private extractEmailsFromPerson(person: any): Array<{
    email: string;
    email_status: string;
    email_source?: string;
    position: number;
    free_domain?: boolean;
    confidence?: number;
  }> {
    console.log('🔍 Iniciando extração de emails com estratégia de 6 campos');
    console.log('👤 Dados da pessoa para extração:', person);
    
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

    // 1. Email direto
    if (person.email && person.email.includes('@') && !person.email.includes('email_not_unlocked')) {
      rawEmail = person.email;
      emailSource = 'direct_email';
      emailStatus = 'verified';
      confidence = 95;
      console.log('✅ Email encontrado em: direct email');
    }

    // 2. Personal emails array
    else if (person.personal_emails && person.personal_emails.length > 0) {
      const personalEmail = person.personal_emails[0]?.email;
      if (personalEmail && personalEmail.includes('@') && !personalEmail.includes('email_not_unlocked')) {
        rawEmail = personalEmail;
        emailSource = 'personal_emails';
        emailStatus = person.personal_emails[0]?.email_status || 'verified';
        confidence = 90;
        console.log('✅ Email encontrado em: personal_emails');
      }
    }

    // 3. Contact emails array
    else if (person.contact_emails && person.contact_emails.length > 0) {
      const contactEmail = person.contact_emails[0]?.email;
      if (contactEmail && contactEmail.includes('@') && !contactEmail.includes('email_not_unlocked')) {
        rawEmail = contactEmail;
        emailSource = 'contact_emails';
        emailStatus = person.contact_emails[0]?.email_status || 'verified';
        confidence = 85;
        console.log('✅ Email encontrado em: contact_emails');
      }
    }

    // 4. Work email
    else if (person.work_email && person.work_email.includes('@') && !person.work_email.includes('email_not_unlocked')) {
      rawEmail = person.work_email;
      emailSource = 'work_email';
      emailStatus = 'verified';
      confidence = 80;
      console.log('✅ Email encontrado em: work_email');
    }

    // 5. Extrapolated email
    else if (person.extrapolated_email && person.extrapolated_email.includes('@') && !person.extrapolated_email.includes('email_not_unlocked')) {
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
        if (person[field] && person[field].includes('@') && !person[field].includes('email_not_unlocked')) {
          rawEmail = person[field];
          emailSource = field;
          emailStatus = field.includes('verified') ? 'verified' : 'guessed';
          confidence = field.includes('verified') ? 85 : 60;
          console.log(`✅ Email encontrado em: ${field}`);
          break;
        }
      }
    }

    // Se encontrou um email, adicionar à lista
    if (rawEmail) {
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
    }

    // Tentar extrair emails adicionais de arrays
    const emailArrays = [
      { field: 'contact_emails', source: 'contact_emails' },
      { field: 'personal_emails', source: 'personal_emails' },
      { field: 'work_emails', source: 'work_emails' },
      { field: 'business_emails', source: 'business_emails' }
    ];

    for (const { field, source } of emailArrays) {
      if (person[field] && Array.isArray(person[field])) {
        person[field].forEach((emailObj: any, index: number) => {
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
        });
      }
    }

    console.log(`📊 Total de emails extraídos: ${extractedEmails.length}`);
    
    return extractedEmails;
  }

  // Método principal para buscar emails de uma pessoa
  async searchPersonEmails(personId: string, organizationId?: string): Promise<EmailSearchResponse> {
    console.log(`🔍 ApolloEmailCapture - searchPersonEmails para ID: ${personId}`);
    console.log(`🏢 Organization ID: ${organizationId}`);

    // Validação inicial
    if (!personId || personId.trim() === '') {
      console.error('❌ ID da pessoa é obrigatório');
      return {
        person: { id: 'invalid', name: 'Invalid ID', title: 'N/A' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ ID da pessoa é obrigatório para buscar emails'
      };
    }

    // Strategy 1: POST people/match com query parameters
    try {
      console.log('📡 Strategy 1: POST people/match com query parameters');
      
      const body: any = {
        id: personId.toString().trim()
      };

      if (organizationId) {
        body.organization_id = organizationId.toString().trim();
      }

      console.log('📋 Body da requisição:', body);

      const queryParams = new URLSearchParams({
        reveal_personal_emails: 'true',
        reveal_phone_number: 'true'
      });

      const response = await Promise.race([
        this.makeRequest(`https://api.apollo.io/v1/people/match?${queryParams.toString()}`, {
          method: 'POST',
          body: JSON.stringify(body),
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: 30 segundos')), 30000)
        )
      ]) as any;

      console.log('✅ Strategy 1 - Resposta recebida:', response);
      
      if (response && (response.person || response.id)) {
        const personData = response.person || response;
        
        // Aplicar estratégia de extração de emails
        const extractedEmails = this.extractEmailsFromPerson(personData);
        const phoneNumbers = personData.phone_numbers || [];

        console.log(`📧 Strategy 1 - Emails extraídos: ${extractedEmails.length}`);
        console.log(`📞 Strategy 1 - Telefones encontrados: ${phoneNumbers.length}`);

        return {
          person: personData,
          emails: extractedEmails,
          phone_numbers: Array.isArray(phoneNumbers) ? phoneNumbers : [],
          success: true,
          message: `✅ Strategy 1 sucesso: ${extractedEmails.length} email(s), ${phoneNumbers.length} telefone(s)`
        };
      }
    } catch (error) {
      console.log('❌ Strategy 1 falhou:', error instanceof Error ? error.message : 'Erro desconhecido');
    }

    // Strategy 2: POST people/match simplificado
    try {
      console.log('📡 Strategy 2: POST people/match simplificado');
      
      const body: any = {
        id: personId.toString().trim(),
        reveal_personal_emails: true,
        reveal_phone_number: true
      };

      console.log('📋 Body simplificado:', body);

      const response = await Promise.race([
        this.makeRequest('/people/match', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: 30 segundos')), 30000)
        )
      ]) as any;

      console.log('✅ Strategy 2 - Resposta recebida:', response);
      
      if (response && (response.person || response.id)) {
        const personData = response.person || response;
        
        // Aplicar estratégia de extração de emails
        const extractedEmails = this.extractEmailsFromPerson(personData);
        const phoneNumbers = personData.phone_numbers || [];

        return {
          person: personData,
          emails: extractedEmails,
          phone_numbers: Array.isArray(phoneNumbers) ? phoneNumbers : [],
          success: true,
          message: `✅ Strategy 2 sucesso: ${extractedEmails.length} email(s), ${phoneNumbers.length} telefone(s)`
        };
      }
    } catch (error) {
      console.log('❌ Strategy 2 falhou:', error instanceof Error ? error.message : 'Erro desconhecido');
    }

    // Strategy 3: GET people/{id}
    try {
      console.log('📡 Strategy 3: GET people/{id}');
      
      const response = await Promise.race([
        this.makeRequest(`/people/${personId}`, {
          method: 'GET',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: 30 segundos')), 30000)
        )
      ]) as any;

      console.log('✅ Strategy 3 - Resposta recebida:', response);
      
      if (response && (response.person || response.id)) {
        const personData = response.person || response;
        
        // Aplicar estratégia de extração de emails
        const extractedEmails = this.extractEmailsFromPerson(personData);
        const phoneNumbers = personData.phone_numbers || [];

        return {
          person: personData,
          emails: extractedEmails,
          phone_numbers: Array.isArray(phoneNumbers) ? phoneNumbers : [],
          success: true,
          message: `✅ Strategy 3 sucesso: ${extractedEmails.length} email(s), ${phoneNumbers.length} telefone(s)`
        };
      }
    } catch (error) {
      console.log('❌ Strategy 3 falhou:', error instanceof Error ? error.message : 'Erro desconhecido');
    }

    // Fallback seguro
    console.log(`❌ Todas as strategies falharam para ID: ${personId}`);
    return {
      person: { 
        id: personId, 
        name: 'Pessoa não encontrada', 
        title: 'N/A',
        email: undefined
      } as any,
      emails: [],
      phone_numbers: [],
      success: false,
      message: `❌ Não foi possível encontrar dados para o ID ${personId}.\n\nPossíveis causas:\n• ID inválido ou pessoa não encontrada\n• Problemas de conectividade\n• Limitações do plano Apollo.io\n• Timeout na requisição\n\nTente novamente em alguns segundos.`
    };
  }
}

// Function to capture emails from a single person using the new class
async function captureEmailFromPerson(
  person: Person,
  apiKey: string
): Promise<EmailSearchResponse> {
  // Validação inicial para prevenir crashes
  if (!person || !person.id) {
    console.error('❌ Pessoa ou ID inválido:', person);
    return {
      person: person || { id: 'invalid', name: 'Invalid Person', title: 'N/A' } as any,
      emails: [],
      phone_numbers: [],
      success: false,
      message: '❌ Dados da pessoa são inválidos'
    };
  }

  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ API Key é obrigatória');
    return {
      person: person,
      emails: [],
      phone_numbers: [],
      success: false,
      message: '❌ API Key é obrigatória para buscar emails'
    };
  }

  console.log(`🔍 Iniciando busca de email por ID para: ${person.name}`);
  console.log(`📋 ID da pessoa: ${person.id}`);
  console.log(`🏢 Organization ID: ${person.organization?.id || person.organization_id || 'N/A'}`);

  // Strategy 1: Check existing data first (fastest and safest)
  console.log('📡 Strategy 1: Verificando dados existentes');
  
  // Usar a classe ApolloEmailCapture para extrair emails dos dados existentes
  const emailCapture = new ApolloEmailCapture(apiKey);
  const existingEmails = (emailCapture as any).extractEmailsFromPerson(person);
  
  if (existingEmails.length > 0) {
    console.log(`✅ ${existingEmails.length} email(s) já disponível(is) nos dados existentes`);
    return {
      person: person,
      emails: existingEmails,
      phone_numbers: person.phone_numbers || [],
      success: true,
      message: `✅ ${existingEmails.length} email(s) já disponível(is) nos dados da pessoa`
    };
  }

  // Strategy 2: Use ApolloEmailCapture class to fetch from API
  try {
    console.log('📡 Strategy 2: Usando ApolloEmailCapture para buscar na API');
    
    const result = await emailCapture.searchPersonEmails(
      person.id,
      person.organization?.id || person.organization_id
    );
    
    if (result.success && result.emails.length > 0) {
      console.log(`✅ ApolloEmailCapture sucesso: ${result.emails.length} emails encontrados`);
      return result;
    }
  } catch (error) {
    console.log('❌ ApolloEmailCapture erro:', error instanceof Error ? error.message : 'Erro desconhecido');
  }

  // Safe fallback to prevent app crash
  console.log(`❌ Todas as strategies falharam para ${person.name} (ID: ${person.id})`);

  return {
    person: person,
    emails: [],
    phone_numbers: person.phone_numbers || [],
    success: false,
    message: `❌ Email não encontrado para ${person.name}.\n\nPossíveis causas:\n• Plano Apollo.io não permite revelar emails\n• Email não disponível publicamente\n• Timeout na requisição\n• Problemas de conectividade\n\nTente novamente em alguns segundos.`
  };
}

// Function to capture emails from multiple persons with progress callback
export async function captureEmailsFromPersons(
  persons: Person[],
  apiKey: string,
  onProgress?: (current: number, total: number, person: Person, result: EmailSearchResponse) => void
): Promise<Array<{ person: Person; result: EmailSearchResponse }>> {
  const results: Array<{ person: Person; result: EmailSearchResponse }> = [];
  
  console.log(`🚀 Iniciando captura em lote para ${persons.length} pessoas usando estratégia de 6 campos`);
  
  // Validação inicial
  if (!persons || persons.length === 0) {
    console.log('❌ Nenhuma pessoa fornecida para captura em lote');
    return [];
  }

  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ API Key é obrigatória para captura em lote');
    return persons.map(person => ({
      person,
      result: {
        person,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ API Key é obrigatória'
      }
    }));
  }

  for (let i = 0; i < persons.length; i++) {
    const person = persons[i];
    
    // Skip invalid persons
    if (!person || !person.id) {
      console.log(`⚠️ Pulando pessoa inválida no índice ${i}`);
      const failedResult: EmailSearchResponse = {
        person: person || { id: 'invalid', name: 'Invalid', title: 'N/A' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ Dados da pessoa são inválidos'
      };
      results.push({ person: person || {} as Person, result: failedResult });
      
      if (onProgress) {
        onProgress(i + 1, persons.length, person || {} as Person, failedResult);
      }
      continue;
    }

    try {
      // Rate limiting
      if (i > 0) {
        console.log(`⏳ Aguardando 2 segundos...`);
        await delay(2000); // Conservative delay
      }
      
      console.log(`📋 Processando pessoa ${i + 1}/${persons.length}: ${person.name} (ID: ${person.id})`);
      
      // Add timeout to prevent hanging
      const result = await Promise.race([
        captureEmailFromPerson(person, apiKey),
        new Promise<EmailSearchResponse>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Processamento demorou mais de 45 segundos')), 45000)
        )
      ]);
      
      results.push({ person, result });
      
      if (onProgress) {
        onProgress(i + 1, persons.length, person, result);
      }
      
      console.log(`✅ Pessoa ${i + 1} processada: ${result.success ? 'Sucesso' : 'Falha'} - ${result.emails.length} emails`);
    } catch (error) {
      console.error(`❌ Erro ao processar pessoa ${person.name} (ID: ${person.id}):`, error);
      
      const failedResult: EmailSearchResponse = {
        person: person,
        emails: [],
        phone_numbers: person.phone_numbers || [],
        success: false,
        message: `❌ Erro técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
      
      results.push({ person, result: failedResult });
      
      if (onProgress) {
        onProgress(i + 1, persons.length, person, failedResult);
      }
    }
  }
  
  console.log(`🏁 Captura em lote finalizada. ${results.length} pessoas processadas`);
  const successCount = results.filter(r => r.result.success).length;
  const emailsFound = results.reduce((total, r) => total + r.result.emails.length, 0);
  console.log(`📊 Resumo: ${successCount} sucessos, ${results.length - successCount} falhas, ${emailsFound} emails`);
  
  return results;
}