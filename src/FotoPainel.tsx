// FotoPainel.tsx
import { useEffect } from 'react';

interface FotoPainelProps {
  obraId: number;
  onFotoUrl: (url: string | null) => void;
}

const FotoPainel: React.FC<FotoPainelProps> = ({ obraId, onFotoUrl }) => {
  useEffect(() => {
    const fetchFotoPainel = async () => {
      const query = `
        query {
          obrasServicosDetails(entidade: 141) {
            id
            lotes {
              diarios {
                id
                data
                fotos {
                  name
                }
              }
            }
          }
        }
      `;

      try {
        const response = await fetch('https://painel-obras-publicas-pml.vercel.app/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        const obras = result.data.obrasServicosDetails;
        const obra = obras.find((o: any) => o.id === obraId);
        if (!obra) return onFotoUrl(null);

        const extensoesValidas = ['.jpg', '.jpeg', '.png'];
        const fotosPainel = [];

        for (const lote of obra.lotes) {
          for (const diario of lote.diarios) {
            const fotos = diario.fotos.filter(
              (f: any) =>
                f.name.toLowerCase().includes('painel') &&
                extensoesValidas.some(ext => f.name.toLowerCase().endsWith(ext))
            );
            if (fotos.length > 0) {
              fotosPainel.push({ data: diario.data, id: diario.id, foto: fotos[0] });
            }
          }
        }

        if (fotosPainel.length === 0) return onFotoUrl(null);

        fotosPainel.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        const { id: diarioId, foto } = fotosPainel[0];

        const queryFoto = `
          query {
            fotoMedicao(
              entidade: 141,
              id: ${diarioId},
              name: "${foto.name}",
              url: true,
              diario: true
            )
          }
        `;

        const fotoResponse = await fetch('https://painel-obras-publicas-pml.vercel.app/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryFoto }),
        });

        const fotoResult = await fotoResponse.json();
        onFotoUrl(fotoResult.data.fotoMedicao || null);
      } catch (error) {
        console.error('Erro ao buscar foto do painel:', error);
        onFotoUrl(null);
      }
    };

    fetchFotoPainel();
  }, [obraId, onFotoUrl]);

  return null; // Componente apenas busca e envia a URL para o App
};

export default FotoPainel;
