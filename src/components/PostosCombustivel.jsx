import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Fuel,
  Star,
  Pencil,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { buscarEnderecos } from '../utils/geocode';
import { calcularDistanciaKm } from '../utils/rotasUtils';
import { formatarDataBR, diffDias } from '../utils/dataUtils';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const PRECO_VELHO_DIAS = 14;

export default function PostosCombustivel({ postos = [], loading, adicionarPosto, registrarPreco, excluirPosto, config }) {
  const latCasa = config?.latCasa ?? -21.2687653;
  const lngCasa = config?.lngCasa ?? -47.8197413;

  const [form, setForm] = useState({ nome: '', endereco: '', precoGasolina: '', precoEtanol: '', bandeira: '' });
  const [ponto, setPonto] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(null); // { id, tipo }
  const [novoPreco, setNovoPreco] = useState('');
  const debounce = useRef(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = form.endereco.trim();
    if (q.length < 3) {
      setSugestoes([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setBuscando(true);
      setErroBusca('');
      try {
        const res = await buscarEnderecos(q, { lat: latCasa, lon: lngCasa });
        setSugestoes(res);
      } catch (e) {
        setErroBusca(e.message || 'Falha na busca de endereço.');
      } finally {
        setBuscando(false);
      }
    }, 450);
    return () => debounce.current && clearTimeout(debounce.current);
  }, [form.endereco, latCasa, lngCasa]);

  const postosComInfo = useMemo(() => {
    return postos
      .map((p) => ({
        ...p,
        distanciaCasa:
          p.latitude != null ? calcularDistanciaKm(latCasa, lngCasa, p.latitude, p.longitude) : null,
        gasolinaVelho: p.dataGasolina ? (diffDias(p.dataGasolina, new Date()) ?? 99) > PRECO_VELHO_DIAS : true,
        etanolVelho: p.dataEtanol ? (diffDias(p.dataEtanol, new Date()) ?? 99) > PRECO_VELHO_DIAS : true,
      }))
      .sort((a, b) => (a.distanciaCasa ?? 9999) - (b.distanciaCasa ?? 9999));
  }, [postos, latCasa, lngCasa]);

  const maisBarato = useMemo(() => {
    const validos = (tipo, campoData) =>
      postos
        .filter((p) => Number(p[tipo]) > 0)
        .filter((p) => (diffDias(p[campoData], new Date()) ?? 99) <= 45); // ignora preços muito antigos
    const g = validos('precoGasolina', 'dataGasolina').sort((a, b) => a.precoGasolina - b.precoGasolina)[0];
    const e = validos('precoEtanol', 'dataEtanol').sort((a, b) => a.precoEtanol - b.precoEtanol)[0];
    return { gasolina: g, etanol: e };
  }, [postos]);

  const selecionar = (s) => {
    setPonto(s);
    setForm((f) => ({ ...f, endereco: s.display_name, nome: f.nome || s.titulo }));
    setSugestoes([]);
  };

  const submeter = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() && !form.endereco.trim()) return;
    setSalvando(true);
    try {
      let lat = ponto?.lat ?? null;
      let lon = ponto?.lon ?? null;
      if ((lat == null || lon == null) && form.endereco.trim().length > 3) {
        const g = await buscarEnderecos(form.endereco, { limite: 1 });
        if (g[0]) {
          lat = g[0].lat;
          lon = g[0].lon;
        }
      }
      await adicionarPosto({
        nome: form.nome,
        endereco: ponto?.display_name || form.endereco,
        latitude: lat,
        longitude: lon,
        bandeira: form.bandeira,
        precoGasolina: form.precoGasolina.replace(',', '.'),
        precoEtanol: form.precoEtanol.replace(',', '.'),
      });
      setForm({ nome: '', endereco: '', precoGasolina: '', precoEtanol: '', bandeira: '' });
      setPonto(null);
      setAberto(false);
    } catch (err) {
      console.error(err);
      alert('Não foi possível salvar o posto.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarNovoPreco = async () => {
    if (!editando) return;
    try {
      await registrarPreco(editando.id, editando.tipo, novoPreco.replace(',', '.'));
      setEditando(null);
      setNovoPreco('');
    } catch (err) {
      alert(err.message || 'Preço inválido.');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Postos & Preços</h2>
            <p className="text-xs text-gray-500">Onde abastecer mais barato perto de casa</p>
          </div>
        </div>
        <button
          onClick={() => setAberto((v) => !v)}
          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {aberto ? 'Fechar' : 'Novo posto'}
        </button>
      </div>

      {/* Destaques mais baratos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {[
          { rot: 'Gasolina mais barata', p: maisBarato.gasolina, campo: 'precoGasolina', cor: 'amber' },
          { rot: 'Etanol mais barato', p: maisBarato.etanol, campo: 'precoEtanol', cor: 'green' },
        ].map(({ rot, p, campo, cor }) => (
          <div
            key={rot}
            className={`rounded-2xl p-3 border ${
              cor === 'amber' ? 'bg-amber-50/60 border-amber-200' : 'bg-green-50/60 border-green-200'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1">
              <Star className="w-3 h-3" /> {rot}
            </span>
            {p ? (
              <>
                <div className="text-lg font-black text-gray-900">{brl(p[campo])}</div>
                <div className="text-xs text-gray-600 truncate">
                  {p.nome} {p.distanciaCasa != null && `• ${p.distanciaCasa.toFixed(1)} km`}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400 mt-1">Sem preço registrado</div>
            )}
          </div>
        ))}
      </div>

      {/* Formulário */}
      {aberto && (
        <form onSubmit={submeter} className="mb-4 space-y-2 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nome (ex: Shell Av. Brasil)"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Bandeira (opcional)"
              value={form.bandeira}
              onChange={(e) => setForm((f) => ({ ...f, bandeira: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Endereço ou CEP"
              value={form.endereco}
              onChange={(e) => {
                setForm((f) => ({ ...f, endereco: e.target.value }));
                setPonto(null);
              }}
              className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
            />
            {buscando && (
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin absolute right-2.5 top-2.5" />
            )}
            {erroBusca && (
              <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {erroBusca}
              </p>
            )}
            {sugestoes.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {sugestoes.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => selecionar(s)}
                    className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{s.titulo}</p>
                      <p className="text-[11px] text-gray-500 truncate">{s.subtitulo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Gasolina R$/L"
              value={form.precoGasolina}
              onChange={(e) => setForm((f) => ({ ...f, precoGasolina: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Etanol R$/L"
              value={form.precoEtanol}
              onChange={(e) => setForm((f) => ({ ...f, precoEtanol: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Salvar posto
          </button>
        </form>
      )}

      {/* Lista */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-6 text-xs text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /> Carregando postos...
          </div>
        ) : postosComInfo.length === 0 ? (
          <div className="text-center py-6 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Nenhum posto cadastrado.</p>
            <p className="text-xs text-gray-400 mt-1">
              Adicione os postos que você costuma usar e mantenha os preços atualizados.
            </p>
          </div>
        ) : (
          postosComInfo.map((p) => (
            <div key={p.id} className="p-3 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{p.nome}</h4>
                    {p.id === maisBarato.gasolina?.id || p.id === maisBarato.etanol?.id ? (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                    {p.distanciaCasa != null && (
                      <>
                        <Navigation className="w-3 h-3" />
                        {p.distanciaCasa.toFixed(1)} km de casa •{' '}
                      </>
                    )}
                    {p.endereco}
                  </p>
                </div>
                <button
                  onClick={() => excluirPosto(p.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { tipo: 'Gasolina', preco: p.precoGasolina, data: p.dataGasolina, velho: p.gasolinaVelho },
                  { tipo: 'Etanol', preco: p.precoEtanol, data: p.dataEtanol, velho: p.etanolVelho },
                ].map(({ tipo, preco, data, velho }) => (
                  <div key={tipo} className="bg-gray-50 rounded-lg p-2">
                    {editando?.id === p.id && editando?.tipo === tipo ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={novoPreco}
                          onChange={(e) => setNovoPreco(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && salvarNovoPreco()}
                          className="w-16 px-1.5 py-1 border border-emerald-400 rounded text-xs outline-none"
                        />
                        <button
                          onClick={salvarNovoPreco}
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-1 rounded"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditando({ id: p.id, tipo });
                          setNovoPreco(preco > 0 ? String(preco) : '');
                        }}
                        className="w-full text-left group"
                      >
                        <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center justify-between">
                          {tipo}
                          <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                        </span>
                        <span className="text-sm font-bold text-gray-800 block">
                          {preco > 0 ? brl(preco) : '—'}
                        </span>
                        {preco > 0 && (
                          <span
                            className={`text-[10px] ${velho ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}
                          >
                            {velho ? '⚠ ' : ''}
                            {data ? formatarDataBR(data) : 's/ data'}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        Preços são informados por você. O destaque de "mais barato" ignora registros com mais de 45
        dias e marca com ⚠ os que passaram de {PRECO_VELHO_DIAS} dias.
      </p>
    </div>
  );
}
