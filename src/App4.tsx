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
  ChartOptions
} from 'chart.js';
import obrasData from './data/obras.json';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;
const ITEMS_PER_PAGE = 10;

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
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState('');
  const [obras, setObras] = useState<Obra[]>([]);
  const obrasListRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % obras.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [obras]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPaginaAtual((prev) => (prev + 1) % Math.ceil(obras.length / ITEMS_PER_PAGE));
    }, 5000);
    return () => clearInterval(interval);
  }, [obras]);

  useEffect(() => {
    const interval = setInterval(() => {
      const agora = new Date();
      const prazo = new Date(obras[indiceAtual]?.previsao_termino);
      const diferenca = prazo.getTime() - agora.getTime();
      const diasRestantes = Math.ceil(diferenca / (1000 * 60 * 60 * 24));
      setTempoRestante(diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Prazo expirado');
    }, 1000);
    return () => clearInterval(interval);
  }, [indiceAtual, obras]);

  const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  const obrasPorRegiao = obras.reduce((acc, obra) => {
    acc[obra.regiao] = (acc[obra.regiao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(obrasPorRegiao),
    datasets: [{
      label: 'Obras por Região',
      data: Object.values(obrasPorRegiao),
      backgroundColor: chartColors.slice(0, Object.keys(obrasPorRegiao).length),
      borderColor: chartColors.slice(0, Object.keys(obrasPorRegiao).length),
      borderWidth: 1,
    }]
  };

  return (
    <div 
      className="text-white overflow-hidden"
      style={{ width: `${SCREEN_WIDTH}px`, height: `${SCREEN_HEIGHT}px`, backgroundColor: '#111827' }}
    >
      <div className="flex justify-between items-center p-8">
        <h1 className="text-6xl font-bold">Painel de Obras Públicas</h1>
        <div className="text-4xl">{tempoRestante}</div>
      </div>

      <div className="h-4/5 px-8 pb-8">
        <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-4xl font-bold mb-6">Resumo das Obras</h2>
          <div style={{ height: '250px' }}>
            <Bar data={chartData} options={{ responsive: true }} />
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-3xl font-semibold mb-4">Todas as Obras</h3>
          <div className="h-96 overflow-y-auto relative" ref={obrasListRef}>
            {obras.slice(paginaAtual * ITEMS_PER_PAGE, (paginaAtual + 1) * ITEMS_PER_PAGE).map((obra) => (
              <div key={obra.id} className="p-4 rounded-xl bg-gray-700 mb-2">
                <h3 className="text-xl font-semibold truncate">{obra.descricao}</h3>
                <span>{obra.regiao}</span>
                <div className="w-full bg-gray-600 h-2 rounded-full mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${obra.progresso * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
