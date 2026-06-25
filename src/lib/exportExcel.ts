import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Jogo, Palpite, Usuario } from '@/components/GamesTable';
import { traduzirSelecao } from './selecoes';

export async function exportarParaExcel(
  jogos: Jogo[],
  usuarios: Usuario[],
  palpites: Palpite[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bolão da Copa 2026';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Palpites', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 7 }] // Congela cabeçalho e colunas até "Seleção 2"
  });

  // Ordenar usuários (mesma lógica da tabela)
  const todosOrdenados = [...usuarios].sort((a, b) => a.username.localeCompare(b.username));

  // Definir colunas
  const columns = [
    { header: 'Grupo', key: 'grupo', width: 12 },
    { header: 'Rodada', key: 'rodada', width: 15 },
    { header: 'Data', key: 'data', width: 12 },
    { header: 'Hora', key: 'hora', width: 8 },
    { header: 'Seleção 1', key: 'selecao1', width: 20 },
    { header: 'Placar Oficial', key: 'placar', width: 15 },
    { header: 'Seleção 2', key: 'selecao2', width: 20 },
  ];

  todosOrdenados.forEach(u => {
    columns.push({ header: u.username.toUpperCase(), key: `user_${u.id}`, width: 12 });
  });

  worksheet.columns = columns;

  // Estilizar cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002776' } // Azul do cabeçalho
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF003D99' } },
      left: { style: 'thin', color: { argb: 'FF003D99' } },
      bottom: { style: 'thin', color: { argb: 'FF003D99' } },
      right: { style: 'thin', color: { argb: 'FF003D99' } }
    };
    
    // Para as colunas dos usuários, vamos pintar com um azul mais claro ou amarelo sutil
    if (colNumber > 7) {
      cell.font = { bold: true, color: { argb: 'FFFFDF00' } }; // Amarelo
    }
  });

const ISO_SELECOES: Record<string, string> = {
  'México': 'mx', 'África do Sul': 'za', 'Coreia do Sul': 'kr', 'República Tcheca': 'cz',
  'Canadá': 'ca', 'Bósnia e Herzegovina': 'ba', 'Catar': 'qa', 'Suíça': 'ch',
  'Brasil': 'br', 'Marrocos': 'ma', 'Haiti': 'ht', 'Escócia': 'gb-sct',
  'Estados Unidos': 'us', 'Paraguai': 'py', 'Austrália': 'au', 'Turquia': 'tr',
  'Alemanha': 'de', 'Curaçao': 'cw', 'Costa do Marfim': 'ci', 'Equador': 'ec',
  'Holanda': 'nl', 'Japão': 'jp', 'Suécia': 'se', 'Tunísia': 'tn',
  'Bélgica': 'be', 'Egito': 'eg', 'Irã': 'ir', 'Nova Zelândia': 'nz',
  'Espanha': 'es', 'Cabo Verde': 'cv', 'Arábia Saudita': 'sa', 'Uruguai': 'uy',
  'França': 'fr', 'Senegal': 'sn', 'Iraque': 'iq', 'Noruega': 'no',
  'Argentina': 'ar', 'Argélia': 'dz', 'Áustria': 'at', 'Jordânia': 'jo',
  'Portugal': 'pt', 'Congo RD': 'cd', 'Uzbequistão': 'uz', 'Colômbia': 'co',
  'Inglaterra': 'gb-eng', 'Croácia': 'hr', 'Gana': 'gh', 'Panamá': 'pa',
  'Sérvia': 'rs', 'Dinamarca': 'dk', 'Polônia': 'pl', 'Ucrânia': 'ua',
  'País de Gales': 'gb-wls', 'Eslovênia': 'si', 'Eslováquia': 'sk', 'Albânia': 'al',
  'Romênia': 'ro', 'Hungria': 'hu', 'Grécia': 'gr', 'Rússia': 'ru',
  'China': 'cn', 'Índia': 'in', 'Indonésia': 'id', 'Tailândia': 'th',
  'Vietnã': 'vn', 'Filipinas': 'ph', 'Malásia': 'my', 'Nigéria': 'ng',
  'Camarões': 'cm', 'Quênia': 'ke', 'Zâmbia': 'zm', 'Mali': 'ml',
  'Burkina Faso': 'bf', 'Costa Rica': 'cr', 'Honduras': 'hn', 'Guatemala': 'gt',
  'El Salvador': 'sv', 'Cuba': 'cu', 'Jamaica': 'jm', 'Trinidad e Tobago': 'tt',
  'Venezuela': 've', 'Bolívia': 'bo', 'Peru': 'pe', 'Chile': 'cl'
};

  const imageCache: Record<string, number> = {};

  async function getFlagImageId(iso: string): Promise<number | null> {
    if (!iso) return null;
    if (imageCache[iso] !== undefined) return imageCache[iso];
    try {
      const res = await fetch(`https://flagcdn.com/w40/${iso}.png`);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });
      imageCache[iso] = imageId;
      return imageId;
    } catch (e) {
      return null;
    }
  }

  // Preencher dados (usando for...of para permitir async/await ao buscar as bandeiras)
  for (let index = 0; index < jogos.length; index++) {
    const jogo = jogos[index];
    const dataJogo = new Date(jogo.data_hora);
    const isEncerrado = jogo.status === 'ENCERRADO';
    
    const nomeA = traduzirSelecao(jogo.time_a);
    const nomeB = traduzirSelecao(jogo.time_b);
    const isoA = ISO_SELECOES[nomeA];
    const isoB = ISO_SELECOES[nomeB];

    const rowData: any = {
      grupo: jogo.grupo ? jogo.grupo.replace('GROUP_', 'Grupo ') : '',
      rodada: jogo.rodada,
      data: format(dataJogo, 'dd/MM', { locale: ptBR }),
      hora: format(dataJogo, 'HH:mm'),
      selecao1: `        ${nomeA}`, // Espaço para a bandeira na esquerda
      placar: isEncerrado ? `${jogo.placar_a ?? 0} – ${jogo.placar_b ?? 0}` : (jogo.status === 'AO_VIVO' ? 'AO VIVO' : 'vs'),
      selecao2: `        ${nomeB}`, // Espaço para a bandeira na esquerda
    };

    todosOrdenados.forEach(user => {
      const p = palpites.find(palpite => palpite.jogo_id === Number(jogo.id) && palpite.user_id === user.id);
      if (p) {
        rowData[`user_${user.id}`] = `${p.palpite_a} x ${p.palpite_b}`;
      } else {
        rowData[`user_${user.id}`] = '-';
      }
    });

    const row = worksheet.addRow(rowData);
    row.height = 24; // Aumentar altura da linha para acomodar a imagem
    
    // Inserir bandeira A
    const imageIdA = await getFlagImageId(isoA);
    if (imageIdA !== null) {
      worksheet.addImage(imageIdA, {
        tl: { col: 4.1, row: row.number - 1 + 0.2 }, // Coluna E (índice 4), um pouco deslocada
        ext: { width: 22, height: 14 }
      });
    }

    // Inserir bandeira B
    const imageIdB = await getFlagImageId(isoB);
    if (imageIdB !== null) {
      worksheet.addImage(imageIdB, {
        tl: { col: 6.1, row: row.number - 1 + 0.2 }, // Coluna G (índice 6), um pouco deslocada
        ext: { width: 22, height: 14 }
      });
    }

    // Estilizar linha e verificar cravadas
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // As colunas de seleções ficam alinhadas à esquerda para o texto não ficar sob a imagem
      if (colNumber === 5 || colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      const isEven = index % 2 === 0;
      let rowBg = isEven ? 'FFFFFFFF' : 'FFF9FAFB'; // branco / cinza muito claro
      let rowColor = 'FF000000'; // preto
      
      if (isEncerrado) {
        rowBg = isEven ? 'FFF3F4F6' : 'FFE5E7EB'; // cinza claro para encerrados
        rowColor = 'FF4B5563'; // cinza escuro para texto
      }

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg }
      };
      
      cell.font = { color: { argb: rowColor } };
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
      };

      // Destacar placar oficial para encerrados
      if (isEncerrado && colNumber === 6) {
        cell.font = { bold: true, color: { argb: 'FF111827' } }; // Placar oficial mais forte
      }

      // Se for uma coluna de usuário e o jogo estiver encerrado, verificar cravada
      if (colNumber > 7 && isEncerrado) {
        const userId = todosOrdenados[colNumber - 8].id;
        const p = palpites.find(palpite => palpite.jogo_id === Number(jogo.id) && palpite.user_id === userId);
        
        if (p && Number(p.palpite_a) === Number(jogo.placar_a) && Number(p.palpite_b) === Number(jogo.placar_b)) {
          // Cravou! Fundo verde claro e texto verde escuro
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' } // Tailwind green-100
          };
          cell.font = { bold: true, color: { argb: 'FF065F46' } }; // Tailwind green-900
          cell.value = `${cell.value} ✅`;
        }
      }
    });
  }

  // Gerar e salvar arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const timestamp = format(new Date(), "ddMMyyyy_HHmm");
  saveAs(blob, `bolao-copa-2026-palpites_${timestamp}.xlsx`);
}
