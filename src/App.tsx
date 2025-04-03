import { useState, useEffect, useRef } from 'react';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  FontSpec
} from 'chart.js';
import obrasData from './data/obras.json';
import './App.css';

// Registra os componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Configuração fixa para SmartTV
const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;

interface Obra {
  id: number;
  descricao: string;
  regiao: string;
  valor_total: number;
  nome_contratado: string;
  progresso: number;
  data_inicio: string;
  previsao_termino: string;
  situacaoDescricao: string;
  localizacao: string;
}

function App() {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState('');
  const [obras, setObras] = useState<Obra[]>([]);
  const obrasListRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Carrega os dados
  useEffect(() => {
    const dadosFormatados = obrasData.map(obra => ({
      id: obra.id,
      descricao: obra.descricao,
      regiao: obra.regiao,
      valor_total: obra.valor_total,
      nome_contratado: obra.nome_contratado,
      progresso: parseFloat(obra.percentualConcluido.replace(',', '.')) / 100,
      data_inicio: obra.data_inicio,
      previsao_termino: obra.previsao_termino,
      situacaoDescricao: obra.situacaoDescricao,
      localizacao: obra.localizacao
    }));
    setObras(dadosFormatados);
  }, []);

  // Configuração do gráfico de barras
  const obrasPorRegiao = obras.reduce((acc, obra) => {
    acc[obra.regiao] = (acc[obra.regiao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(obrasPorRegiao),
    datasets: [
      {
        label: 'Obras por Região',
        data: Object.values(obrasPorRegiao),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Obras por Região',
        font: {
          size: 20,
          weight: 'bold',
        } as Partial<FontSpec>,
        color: '#ffffff',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#ffffff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  // Centraliza a obra atual na lista
  useEffect(() => {
    if (obrasListRef.current && itemRefs.current[indiceAtual]) {
      const container = obrasListRef.current;
      const selectedItem = itemRefs.current[indiceAtual];

      if (selectedItem) {
        const containerHeight = container.clientHeight;
        const itemHeight = selectedItem.clientHeight;
        const itemOffset = selectedItem.offsetTop;
        const scrollPosition = itemOffset - (containerHeight / 2) + (itemHeight / 2);

        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [indiceAtual, obras]);

  // Rotação automática das obras principais
  useEffect(() => {
    if (obras.length === 0) return;

    const interval = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % obras.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [obras]);

  // Calcula dias restantes
  const calcularDiasRestantes = (dataTermino: string) => {
    const hoje = new Date();
    const termino = new Date(dataTermino);
    return Math.ceil((termino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Formata data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Verifica status do prazo com as novas cores
  const getStatusPrazo = (dias: number, progresso: number) => {
    // Obras concluídas (100%) são sempre verdes
    if (progresso === 1) return {
      texto: 'Concluída',
      cor: 'bg-green-500',
      icone: <CheckCircle size={24} className="mr-2" />
    };

    if (dias < 0) return {
      texto: `Atrasado ${Math.abs(dias)} dias`,
      cor: 'bg-red-500',
      icone: <AlertTriangle size={24} className="mr-2" />
    };
    if (dias <= 30) return {
      texto: `${dias} dias restantes`,
      cor: 'bg-yellow-500',
      icone: <AlertTriangle size={24} className="mr-2" />
    };
    return {
      texto: `${dias} dias restantes`,
      cor: 'bg-blue-500',
      icone: <Calendar size={24} className="mr-2" />
    };
  };

  // Atualiza relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (obras.length === 0) {
    return <div className="flex justify-center items-center h-screen">Carregando obras...</div>;
  }

  const obraAtual = obras[indiceAtual];
  const diasRestantes = calcularDiasRestantes(obraAtual.previsao_termino);
  const statusPrazo = getStatusPrazo(diasRestantes, obraAtual.progresso);
  const percentual = obraAtual.progresso * 100;

  // Calcula totais
  const totalObras = obras.length;
  const totalInvestido = obras.reduce((total, obra) => total + obra.valor_total, 0);

  return (
    <div
      className="text-white overflow-hidden"
      style={{
        width: `${SCREEN_WIDTH}px`,
        height: `${SCREEN_HEIGHT}px`,
        backgroundColor: '#111827'
      }}
    >
      {/* Cabeçalho */}
<div className="flex justify-between items-center p-8">
  <h1 className="text-5xl font-bold flex-1">Painel de Obras Públicas</h1>
  <div className="flex flex-col items-end space-y-2">
    <div className="text-4xl font-medium">{tempoRestante}</div>
    <div className="text-3xl">{new Date().toLocaleDateString('pt-BR')}</div>
  </div>
</div>

      {/* Container principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-4/5 px-8 pb-8">
        {/* Painel principal */}
        <div className="lg:col-span-2 bg-gray-800 rounded-3xl p-8 shadow-2xl relative">
          <div className={`absolute -top-5 -right-5 ${statusPrazo.cor} text-white rounded-full p-4 shadow-xl flex items-center z-10`}>
            {statusPrazo.icone}
            <span className="text-2xl font-bold">{statusPrazo.texto}</span>
          </div>

          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h2 className="text-4xl font-bold mb-4">{obraAtual.descricao}</h2>
              <div className="flex flex-wrap gap-6 text-xl">
                <span>Região: {obraAtual.regiao}</span>
                <span>Contratado: {obraAtual.nome_contratado}</span>
                <span>Local: {obraAtual.localizacao}</span>
                <span>Status: {obraAtual.situacaoDescricao}</span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-6 mb-10">
              <div className="flex justify-between text-3xl mb-4">
                <span>Progresso da Obra</span>
                <span className="font-bold">{percentual.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-8">
                <div
                  className={`h-8 rounded-full ${percentual === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  style={{ width: `${percentual}%` }}
                ></div>
              </div>
            </div>

            {/* Informações */}
            <div className="grid grid-cols-2 gap-8 mt-auto">
              <div>
                <h3 className="text-3xl font-semibold mb-4">Cronograma</h3>
                <div className="space-y-3 text-2xl">
                  <p>Início: {formatarData(obraAtual.data_inicio)}</p>
                  <p>Término: {formatarData(obraAtual.previsao_termino)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-semibold mb-4">Investimento</h3>
                <p className="text-4xl font-bold text-green-400">
                  R$ {obraAtual.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Painel secundário */}
        <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col">
          <h2 className="text-4xl font-bold mb-6">Resumo das Obras</h2>

          {/* Gráfico e totais */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-gray-700 p-4 rounded-xl" style={{ height: '250px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-xl">
                <h3 className="text-2xl font-semibold">Total Obras</h3>
                <p className="text-3xl font-bold text-blue-400">{totalObras}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-xl">
                <h3 className="text-2xl font-semibold">Investimento Total</h3>
                <p className="text-3xl font-bold text-green-400">
                  R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>



          {/* Lista de obras com teleprompter */}
          <div className="flex-grow overflow-hidden">
            <h3 className="text-3xl font-semibold mb-4">Todas as Obras</h3>
            <div className="teleprompter-container bg-gray-900 rounded-xl p-4">
              <div
                className="teleprompter-content"
                style={{
                  transform: `translateY(-${indiceAtual * 105}px)` // Ajuste menor para movimento
                }}
              >
                {obras.map((obra, index) => {
                  const dias = calcularDiasRestantes(obra.previsao_termino);
                  const status = getStatusPrazo(dias, obra.progresso);
                  const obraPercentual = obra.progresso * 100;

                  return (
                    <div
                      key={obra.id}
                      className={`p-4 mb-3 rounded-xl transition-all ${index === indiceAtual
                          ? 'ring-2 ring-blue-500 bg-gray-700 scale-[1.02]'
                          : 'bg-gray-700 opacity-80'
                        }`}
                      style={{
                        minHeight: '80px', // Altura reduzida
                        fontSize: '1.2rem' // Tamanho de fonte reduzido (~50%)
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold truncate">{obra.descricao}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${status.cor}`}>
                          {status.texto}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 text-lg">
                        <span>{obra.regiao}</span>
                        <span className="font-bold">
                          {obraPercentual.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* Indicadores de navegação */}
      <div className="flex justify-center pb-4 space-x-3">
        {obras.map((_, index) => (
          <button
            key={index}
            onClick={() => setIndiceAtual(index)}
            className={`w-4 h-4 rounded-full ${index === indiceAtual ? 'bg-white' : 'bg-gray-600'
              }`}
            aria-label={`Ir para obra ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default App;