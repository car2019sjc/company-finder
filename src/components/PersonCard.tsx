import React from 'react';
import { Phone, MapPin, Building, User, ExternalLink } from 'lucide-react';
import type { Person } from '../types/apollo';

interface PersonCardProps {
  person: Person;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLocation = () => {
    const parts = [person.city, person.state, person.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Localização não especificada';
  };

  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header com Avatar e Informações Básicas */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={person.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getInitialsColor(person.name)} ${person.photo_url ? 'hidden' : ''}`}>
            {getInitials(person.name)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {person.name}
          </h3>
          {person.title && (
            <p className="text-sm text-gray-600 mb-1">{person.title}</p>
          )}
          {(person.organization?.name || person.account?.name) && (
            <div className="flex items-center text-sm text-gray-500">
              <Building className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{person.organization?.name || person.account?.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informações de Contato */}
      <div className="space-y-3 mb-4">
        {/* Email */}
        {person.email && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2 text-purple-500 flex-shrink-0" />
            <span className="text-purple-600 truncate">{person.email}</span>
          </div>
        )}

        {/* Telefones */}
        {person.phone_numbers && person.phone_numbers.length > 0 && (
          <div className="space-y-1">
            {person.phone_numbers.slice(0, 2).map((phone) => (
              <div key={phone.raw_number} className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                <span className="text-green-600">{phone.raw_number}</span>
              </div>
            ))}
          </div>
        )}

        {/* Localização */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
          <span className="truncate">{formatLocation()}</span>
        </div>

        {/* LinkedIn */}
        {person.linkedin_url && (
          <div className="flex items-center text-sm text-gray-600">
            <ExternalLink className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
            <a 
              href={person.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 truncate"
            >
              LinkedIn Profile
            </a>
          </div>
        )}
      </div>

      {/* Informações Adicionais */}
      {person.headline && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic line-clamp-2">
            "{person.headline}"
          </p>
        </div>
      )}

      {/* ID da Pessoa */}
      <div className="mt-2 text-xs text-gray-400">
        ID: {person.id}
      </div>
    </div>
  );
};