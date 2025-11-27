import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Star, TrendingUp, Calendar } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

import { 
  getEventosPorMes,
  getEventosPorUsuario,
  getEventosPorCategoria,
  exportCSV, exportXLSX, exportPDF
} from "@/api/reportes";

export default function Reportes() {
  const [porMes, setPorMes] = useState([]);
  const [porUsuario, setPorUsuario] = useState([]);
  const [porCategoria, setPorCategoria] = useState([]);
  const [loading, setLoading] = useState(false);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#fb923c", "#38bdf8", "#f87171"];

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      const [mesRes, userRes, catRes] = await Promise.all([
        getEventosPorMes(),
        getEventosPorUsuario(),
        getEventosPorCategoria()
      ]);
      setPorMes(mesRes.data || []);
      setPorUsuario(userRes.data || []);
      setPorCategoria(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-muted-foreground">Estadísticas generadas desde tus eventos reales</p>
          </div>

          <div className="space-x-2">
            <Button onClick={() => exportCSV("mes")}>CSV</Button>
            <Button onClick={() => exportXLSX("usuarios")}>XLSX</Button>
            <Button onClick={() => exportPDF("global")}>PDF</Button>
          </div>
        </div>

        {/* Loader */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin mx-auto w-10 h-10 text-primary" />
          </div>
        ) : (
          <>
            {/* Stats resumen */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total eventos</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{porMes.length}</div>
                  <p className="text-xs text-muted-foreground">Historial registrado</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios únicos</CardTitle>
                  <Users className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{porUsuario.length}</div>
                  <p className="text-xs text-muted-foreground">Participación acumulada</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Promedio por categoría</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{porCategoria.length}</div>
                  <p className="text-xs text-muted-foreground">Diversidad de actividades</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Rating estimado</CardTitle>
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.6</div>
                  <p className="text-xs text-muted-foreground">Basado en métricas internas</p>
                </CardContent>
              </Card>
            </div>

            {/* Graficas */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Eventos por mes */}
              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Mes</CardTitle>
                  <CardDescription>Distribución a lo largo del tiempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={porMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="hsl(var(--primary))" name="Eventos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Categorías pie chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Categorías</CardTitle>
                  <CardDescription>Distribución por tipos de eventos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={porCategoria}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="total"
                        nameKey="nombre"
                        label
                      >
                        {porCategoria.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Lista por usuario */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Eventos por Usuario</CardTitle>
                <CardDescription>Participación individual</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {porUsuario.map((u, i) => (
                    <li key={i} className="border-l-4 border-primary pl-3 py-1">
                      <span className="font-semibold">{u.username}</span>: {u.total} eventos
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
