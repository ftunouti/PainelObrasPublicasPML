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
import logoPML from './img/logoPML.jpg';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

async function fetchObras() {
    const query = `
      query {
        obrasServicosDetails(entidade: 141) {
          id
          apelido
          numero
          situacao
          localizacao
          regiao
          numero_contrato
          nome_contratado
          valor_total_contratos
          progresso
          data_inicio
          previsao_termino
        }
      }
    `;
  
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        throw new Error('Erro na requisição');
      }
  
      const result = await response.json();
      return result.data.obrasServicosDetails;
    } catch (error) {
      console.error('Erro ao buscar obras:', error);
      throw error;
    }
  }

function App() {
    const [indiceAtual, setIndiceAtual] = useState(0);
    const [tempoRestante, setTempoRestante] = useState('');
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const obrasListRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    useEffect(() => {
        const interval = setInterval(() => {
          window.location.reload();
        }, 30 * 60 * 1000); // 30 minutos em milissegundos
      
        return () => clearInterval(interval); // limpa o intervalo ao desmontar o componente
      }, []);



    useEffect(() => {
        const loadObras = async () => {
            try {
                const obrasApi = await fetchObras();
                const dadosFormatados = obrasApi.map((obra: any) => ({
                    id: obra.id,
                    descricao: obra.apelido || `Obra ${obra.numero}`,
                    regiao: obra.regiao || 'Desconhecida',
                    valor_total: obra.valor_total_contratos || 0,
                    nome_contratado: obra.nome_contratado || 'Não informado',
                    progresso: obra.progresso || 0,
                    data_inicio: obra.data_inicio,
                    previsao_termino: obra.previsao_termino,
                    situacaoDescricao: obra.situacao || 'Em andamento',
                    localizacao: obra.localizacao || 'Local não especificado'
                }));
                setObras(dadosFormatados);
                setLoading(false);
            } catch (err) {
                setError('Erro ao carregar os dados das obras');
                setLoading(false);
                console.error('Erro na requisição:', err);
            }
        };

        loadObras();
    }, []);

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

    useEffect(() => {
        if (obras.length === 0) return;

        const interval = setInterval(() => {
            setIndiceAtual((prev) => (prev + 1) % obras.length);
        }, 12000);
        return () => clearInterval(interval);
    }, [obras]);

    const calcularDiasRestantes = (dataTermino: string) => {
        const hoje = new Date();
        const termino = new Date(dataTermino);
        return Math.ceil((termino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    };

    const formatarData = (data: string) => {
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const getStatusPrazo = (dias: number, progresso: number) => {
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

    useEffect(() => {
        const timer = setInterval(() => {
            setTempoRestante(new Date().toLocaleTimeString('pt-BR'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Carregando obras...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    if (obras.length === 0) {
        return <div className="flex justify-center items-center h-screen">Nenhuma obra encontrada</div>;
    }

    const obraAtual = obras[indiceAtual];
    const diasRestantes = calcularDiasRestantes(obraAtual.previsao_termino);
    const statusPrazo = getStatusPrazo(diasRestantes, obraAtual.progresso);
    const percentual = obraAtual.progresso * 100;

    const totalObras = obras.length;
    const totalInvestido = obras.reduce((total, obra) => total + obra.valor_total, 0);

    return (
        <div
            className="min-h-screen text-white overflow-hidden flex flex-col"
            style={{
                width: `${SCREEN_WIDTH}px`,
                height: `${SCREEN_HEIGHT}px`,
                backgroundColor: '#111827'
            }}
        >
            <div className="flex justify-between items-center p-8">
                <h1 className="text-5xl font-bold flex-1">Painel de Obras Públicas</h1>
                <div className="flex flex-col items-end space-y-2">
                    <div className="text-3xl font-medium">{tempoRestante}</div>
                    <div className="text-2xl">{new Date().toLocaleDateString('pt-BR')}</div>
                </div>
            </div>

            <div className="flex flex-col flex-grow px-8 pb-8 gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 height=200px">
                    <div className="lg:col-span-2 bg-gray-800 rounded-3xl p-8 shadow-2xl relative flex flex-col">
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

                            <div className="mt-6 mb-10">
                                <div className="flex justify-between text-3xl">
                                    <span>Progresso da Obra</span>
                                    <span className="font-bold">{percentual.toFixed(2)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-8">
                                    <div
                                        className={`h-8 rounded-full ${percentual === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${percentual}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-8 mt-auto">
                                <div>
                                    <h3 className="text-3xl font-semibold">Cronograma</h3>
                                    <div className="space-y-3 text-2xl">
                                        <p>Início: {formatarData(obraAtual.data_inicio)}</p>
                                        <p>Término: {formatarData(obraAtual.previsao_termino)}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-semibold">Investimento</h3>
                                    <p className="text-4xl font-bold text-green-400">
                                        R$ {obraAtual.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex items-end justify-start">
                                    <img 
                                        src={logoPML} 
                                        alt="Logo PML" 
                                        className="h-24 object-contain" 
                                        style={{ maxWidth: '360px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col">
                        <h2 className="text-2xl font-semibold mb-4">Resumo das Obras</h2>

                        <div className="grid grid-cols-1 gap-6 mb-6">
                            <div className="bg-gray-700 p-4 rounded-xl" style={{ height: '240px' }}>
                                <Bar data={chartData} options={chartOptions} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-700 p-4 rounded-xl">
                                    <h3 className="text-lg font-medium">Total Obras</h3>
                                    <p className="text-xl font-semibold text-blue-400">{totalObras}</p>
                                </div>
                                <div className="bg-gray-700 p-4 rounded-xl">
                                    <h3 className="text-lg font-medium">Investimento Total</h3>
                                    <p className="text-xl font-semibold text-green-400">
                                        R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow min-w-0">
                            <h3 className="text-xl font-medium mb-2">Todas as Obras</h3>

                            <div
                                className="teleprompter-container bg-gray-900 rounded-xl"
                                style={{
                                    height: '360px',
                                    overflow: 'hidden',
                                }}
                                ref={obrasListRef}
                            >
                                <div className="teleprompter-content">
                                    {obras.map((obra, index) => {
                                        const dias = calcularDiasRestantes(obra.previsao_termino);
                                        const status = getStatusPrazo(dias, obra.progresso);

                                        return (
                                            <div
                                                key={obra.id}
                                                ref={(el) => {
                                                    itemRefs.current[index] = el;
                                                }}
                                                className={`p-1.5 rounded-md transition-all text-sm overflow-hidden ${index === indiceAtual
                                                        ? 'ring-1 ring-blue-500 bg-gray-700 scale-[1.01]'
                                                        : 'bg-gray-700 opacity-80'
                                                    }`}
                                            >
                                                <div className="flex items-center overflow-hidden">
                                                    <div className="flex-1 overflow-hidden">
                                                        <span className="block truncate text-ellipsis">{obra.descricao}</span>
                                                    </div>
                                                    <span
                                                        className={`w-3 h-3 ml-2 rounded-full flex-shrink-0 ${status.cor}`}
                                                        title={status.texto}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center pb-4 space-x-3">
                    {obras.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setIndiceAtual(index)}
                            className={`w-4 h-4 rounded-full ${index === indiceAtual ? 'bg-white' : 'bg-gray-600'}`}
                            aria-label={`Ir para obra ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;