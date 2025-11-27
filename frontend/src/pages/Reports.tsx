import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { getEventosPorMes, getEventosPorUsuario, getEventosPorCategoria, exportCSV, exportXLSX, exportPDF } from '@/api/reportes'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function Reportes() {
  const [porMes, setPorMes] = useState<any[]>([])
  const [porUsuario, setPorUsuario] = useState<any[]>([])
  const [porCategoria, setPorCategoria] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const [mesRes, userRes, catRes] = await Promise.all([
        getEventosPorMes(),
        getEventosPorUsuario(),
        getEventosPorCategoria()
      ])
      setPorMes(mesRes.data || [])
      setPorUsuario(userRes.data || [])
      setPorCategoria(catRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Reportes</h1>
          <div className="space-x-2">
            <Button onClick={() => exportCSV('mes')}>CSV (mes)</Button>
            <Button onClick={() => exportXLSX('usuarios')}>XLSX (usuarios)</Button>
            <Button onClick={() => exportPDF('global')}>PDF (global)</Button>
          </div>
        </div>

        {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
          <>
            <section className="mb-6 bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Eventos por mes</h2>
              <ul>
                {porMes.map((r,i) => <li key={i}>{new Date(r.mes).toLocaleDateString()}: {r.total}</li>)}
              </ul>
            </section>

            <section className="mb-6 bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Eventos por usuario</h2>
              <ul>
                {porUsuario.map((r,i) => <li key={i}>{r.username}: {r.total}</li>)}
              </ul>
            </section>

            <section className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Eventos por categoría</h2>
              <ul>
                {porCategoria.map((r,i) => <li key={i}>{r.nombre}: {r.total}</li>)}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
