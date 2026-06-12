/**
 * Mapa de nomes de seleções em Português Brasileiro
 * Baseado nos nomes retornados pela API football-data.org
 */
export const TRADUCOES_SELECOES: Record<string, string> = {
  // Grupo A
  'Mexico': 'México',
  'South Africa': 'África do Sul',
  'South Korea': 'Coreia do Sul',
  'Czechia': 'República Tcheca',

  // Grupo B
  'Canada': 'Canadá',
  'Bosnia-Herzegovina': 'Bósnia e Herzegovina',
  'Qatar': 'Catar',
  'Switzerland': 'Suíça',

  // Grupo C
  'Brazil': 'Brasil',
  'Morocco': 'Marrocos',
  'Haiti': 'Haiti',
  'Scotland': 'Escócia',

  // Grupo D
  'United States': 'Estados Unidos',
  'Paraguay': 'Paraguai',
  'Australia': 'Austrália',
  'Turkey': 'Turquia',

  // Grupo E
  'Germany': 'Alemanha',
  'Curaçao': 'Curaçao',
  'Ivory Coast': 'Costa do Marfim',
  'Ecuador': 'Equador',

  // Grupo F
  'Netherlands': 'Holanda',
  'Japan': 'Japão',
  'Sweden': 'Suécia',
  'Tunisia': 'Tunísia',

  // Grupo G
  'Belgium': 'Bélgica',
  'Egypt': 'Egito',
  'Iran': 'Irã',
  'New Zealand': 'Nova Zelândia',

  // Grupo H
  'Spain': 'Espanha',
  'Cape Verde Islands': 'Cabo Verde',
  'Saudi Arabia': 'Arábia Saudita',
  'Uruguay': 'Uruguai',

  // Grupo I
  'France': 'França',
  'Senegal': 'Senegal',
  'Iraq': 'Iraque',
  'Norway': 'Noruega',

  // Grupo J
  'Argentina': 'Argentina',
  'Algeria': 'Argélia',
  'Austria': 'Áustria',
  'Jordan': 'Jordânia',

  // Grupo K
  'Portugal': 'Portugal',
  'Congo DR': 'Congo RD',
  'Uzbekistan': 'Uzbequistão',
  'Colombia': 'Colômbia',

  // Grupo L
  'England': 'Inglaterra',
  'Croatia': 'Croácia',
  'Ghana': 'Gana',
  'Panama': 'Panamá',

  // Outros possíveis
  'Serbia': 'Sérvia',
  'Denmark': 'Dinamarca',
  'Poland': 'Polônia',
  'Ukraine': 'Ucrânia',
  'Wales': 'País de Gales',
  'Slovenia': 'Eslovênia',
  'Slovakia': 'Eslováquia',
  'Albania': 'Albânia',
  'Romania': 'Romênia',
  'Hungary': 'Hungria',
  'Greece': 'Grécia',
  'Russia': 'Rússia',
  'China': 'China',
  'India': 'Índia',
  'Indonesia': 'Indonésia',
  'Thailand': 'Tailândia',
  'Vietnam': 'Vietnã',
  'Philippines': 'Filipinas',
  'Malaysia': 'Malásia',
  'Nigeria': 'Nigéria',
  'Cameroon': 'Camarões',
  'Ghana': 'Gana',
  'Kenya': 'Quênia',
  'Zambia': 'Zâmbia',
  'Mali': 'Mali',
  'Burkina Faso': 'Burkina Faso',
  'Côte d\'Ivoire': 'Costa do Marfim',
  'Costa Rica': 'Costa Rica',
  'Honduras': 'Honduras',
  'Guatemala': 'Guatemala',
  'El Salvador': 'El Salvador',
  'Cuba': 'Cuba',
  'Jamaica': 'Jamaica',
  'Trinidad and Tobago': 'Trinidad e Tobago',
  'Venezuela': 'Venezuela',
  'Bolivia': 'Bolívia',
  'Peru': 'Peru',
  'Chile': 'Chile',
  'Switzerland': 'Suíça',
  'Belgium': 'Bélgica',
  'Korea Republic': 'Coreia do Sul',
  'Bosnia-H.': 'Bósnia e Herz.',
};

/** Retorna o nome da seleção em pt-BR, ou o original se não encontrar */
export function traduzirSelecao(nome: string): string {
  return TRADUCOES_SELECOES[nome] ?? nome;
}
