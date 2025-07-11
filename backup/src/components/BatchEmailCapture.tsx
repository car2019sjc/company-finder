import React, { useState } from 'react';
import { Mail, Download, Users, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Person, EmailSearchResponse } from '../types/apollo';
import { captureEmailsFromPersons } from '../services/emailCapture';

interface BatchEmailCaptureProps {
  persons: Person[];
  apolloApiKey: string;
  onComplete?: (results: Array<{ person: Person; result: EmailSearchResponse }>) => void;
}

interface BatchProgress {
  current: number;
  total: number;
  currentPerson: string;
  results: Array<{ person: Person; result: EmailSearchResponse }>;
}

export const BatchEmailCapture: React.FC<BatchEmailCaptureProps> = ({
  persons,
  apolloApiKey,
  onComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<Array<{ person: Person; result: EmailSearchResponse }>>([]);

  // Estado para notificações internas
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Função para mostrar notificação interna
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      setNotification(null);
    }, 8000);
  };

  const startBatchCapture = async () => {
    if (!apolloApiKey || persons.length === 0) return;

    console.log(`🚀 BatchEmailCapture - Iniciando captura para ${persons.length} pessoas`);

    setIsProcessing(true);
    setCompleted(false);
    setResults([]);
    setProgress({
      current: 0,
      total: persons.length,
      currentPerson: '',
      results: []
    });

    try {
      // Add timeout to prevent hanging
      const batchResults = await Promise.race([
        captureEmailsFromPersons(
          persons,
          apolloApiKey,
          (current, total, person, result) => {
            console.log(`📊 Progress: ${current}/${total} - ${person.name} - ${result.success ? 'Sucesso' : 'Falha'}`);
            setProgress(prev => ({
              current,
              total,
              currentPerson: person.name,
              results: prev ? [...prev.results, { person, result }] : [{ person, result }]
            }));
          }
        ),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Captura em lote demorou mais de 10 minutos')), 600000)
        )
      ]);

      console.log(`✅ BatchEmailCapture - Captura finalizada com ${batchResults.length} resultados`);
      setResults(batchResults);
      setCompleted(true);
      
      if (onComplete) {
        onComplete(batchResults);
      }
    } catch (error) {
      console.error('❌ BatchEmailCapture - Erro no processamento em lote:', error);
      
      // Set safe state to prevent crash
      setCompleted(true);
      setResults([]); // Safe fallback
      
      // Show user-friendly error message without alert
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotification('error', `❌ Erro no processamento: ${errorMessage}. Tente com menos pessoas por vez.`);
    } finally {
      setIsProcessing(false);
      console.log('🏁 BatchEmailCapture - Processamento finalizado');
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const csvContent = [
      // Header com BOM para UTF-8
      '\uFEFF' + ['Nome', 'Empresa', 'Cargo', 'Email Original', 'Emails Encontrados', 'Status Email', 'Telefones', 'LinkedIn', 'Localização'].join(','),
      ...results.map(({ person, result }) => {
        const emails = result.emails || [];
        const phones = result.phone_numbers || [];
        const location = [person.city, person.state, person.country].filter(Boolean).join(', ') || 'N/A';
        
        return [
          `"${person.name || 'N/A'}"`,
          `"${person.organization?.name || person.account?.name || 'N/A'}"`,
          `"${person.title || 'N/A'}"`,
          `"${person.email || 'N/A'}"`,
          `"${emails.map(e => e.email).join('; ') || 'Nenhum email encontrado'}"`,
          `"${result.success ? (emails.length > 0 ? 'Email encontrado' : 'Email não disponível') : 'Falha na busca'}"`,
          `"${phones.map(p => p.raw_number).join('; ') || 'N/A'}"`,
          `"${person.linkedin_url || 'N/A'}"`,
          `"${location}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `emails_capturados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSuccessCount = () => results.filter(r => r.result.success && r.result.emails.length > 0).length;
  const getFailureCount = () => results.filter(r => !r.result.success || r.result.emails.length === 0).length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Mail className="w-6 h-6 text-purple-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Captura de Emails em Lote</h3>
            <p className="text-sm text-gray-600">{persons.length} pessoas selecionadas</p>
          </div>
        </div>
        
        {!isProcessing && !completed && (
          <button
            onClick={startBatchCapture}
            disabled={!apolloApiKey || persons.length === 0}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Users className="w-4 h-4 mr-2" />
            Iniciar Captura
          </button>
        )}

        {completed && (
          <button
            onClick={downloadResults}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar CSV
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && progress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Processando: {progress.currentPerson}
            </span>
            <span className="text-sm text-gray-500">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="text-center py-8">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Capturando emails... Isso pode levar alguns minutos.</p>
          <p className="text-sm text-gray-500 mt-2">
            Aguarde enquanto processamos cada pessoa individualmente.
          </p>
        </div>
      )}

      {/* Notification display */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg border ${
          notification.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
          notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {completed && results.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">{getSuccessCount()}</div>
              <div className="text-sm text-green-600">Emails Encontrados</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-800">{getFailureCount()}</div>
              <div className="text-sm text-red-600">Não Encontrados</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">{results.length}</div>
              <div className="text-sm text-blue-600">Total Processado</div>
            </div>
          </div>

          {/* Sample Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
              Amostra dos Resultados ({Math.min(results.length, 10)} de {results.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.slice(0, 10).map(({ person, result }, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-white rounded px-3 py-2 border">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{person.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({person.title || 'Cargo não especificado'})</span>
                  </div>
                  <div className="flex items-center">
                    {result.success && result.emails.length > 0 ? (
                      <span className="text-green-600 flex items-center text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span className="max-w-48 truncate">{result.emails[0].email}</span>
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        <span>Email não disponível</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {results.length > 10 && (
                <div className="text-center text-gray-500 text-xs pt-2 bg-gray-100 rounded px-2 py-1">
                  <span className="font-medium">... e mais {results.length - 10} resultados no arquivo CSV</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Download Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="text-sm font-medium text-blue-800 mb-1">📥 Como usar o arquivo CSV:</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• O arquivo contém todos os {results.length} resultados processados</li>
              <li>• Emails encontrados aparecem na coluna "Emails Encontrados"</li>
              <li>• Status indica se o email foi encontrado com sucesso</li>
              <li>• Inclui informações de contato, LinkedIn e localização</li>
              <li>• Compatível com Excel, Google Sheets e outros programas</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};