import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Star, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

import { 
  getEventosPorMes,
  getEventosPorUsuario,
  getEventosPorCategoria,
  getRatingPromedio,
  exportCSV, exportXLSX, exportPDF
} from "@/api/reportes";

export default function Reportes() {
  const [porMes, setPorMes] = useState([]);
  const [porUsuario, setPorUsuario] = useState([]);
  const [porCategoria, setPorCategoria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ratingData, setRatingData] = useState(null);
  const [error, setError] = useState(null);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#fb923c", "#38bdf8", "#f87171"];

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Iniciando carga de datos...");
      
      const [mesRes, userRes, catRes, ratingRes] = await Promise.all([
        getEventosPorMes(),
        getEventosPorUsuario(),
        getEventosPorCategoria(),
        getRatingPromedio()
      ]);
      
      console.log("Datos recibidos:", {
        mes: mesRes.data,
        usuarios: userRes.data,
        categorias: catRes.data,
        rating: ratingRes.data
      });
      
      setPorMes(mesRes.data || []);
      setPorUsuario(userRes.data || []);
      setPorCategoria(catRes.data || []);
      setRatingData(ratingRes.data || null);
      
    } catch (err) {
      console.error("Error al cargar datos:", err);
      console.error("Error completo:", err.response?.data);
      setError(err.message || "Error al cargar los datos");
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

        {/* Error message */}
        {error && (
          <Card className="mb-6 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="font-semibold">{error}</p>
              </div>
              <Button 
                onClick={fetchAll} 
                variant="outline" 
                className="mt-4"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loader */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin mx-auto w-10 h-10 text-primary" />
            <p className="mt-4 text-muted-foreground">Cargando datos...</p>
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
                  <div className="text-2xl font-bold">
                    {porMes.reduce((acc, item) => acc + (item.total || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Historial registrado</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios activos</CardTitle>
                  <Users className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{porUsuario.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Organizadores únicos</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Categorías</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{porCategoria.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Tipos de eventos</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Rating promedio</CardTitle>
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ratingData?.promedio_global ? 
                      ratingData.promedio_global.toFixed(1) : 
                      "N/A"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ratingData?.total_reseñas || 0} reseñas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Graficas */}
            {(porMes.length > 0 || porCategoria.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Eventos por mes */}
                {porMes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Eventos por Mes</CardTitle>
                      <CardDescription>Distribución a lo largo del tiempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={porMes}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="mes" 
                            tickFormatter={(d) => {
                              try {
                                return new Date(d).toLocaleDateString('es-ES', { 
                                  month: 'short', 
                                  year: 'numeric' 
                                });
                              } catch {
                                return d;
                              }
                            }} 
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="total" fill="hsl(var(--primary))" name="Eventos" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Categorías pie chart */}
                {porCategoria.length > 0 && (
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
                )}
              </div>
            )}

            {/* Rating detallado */}
            {ratingData && ratingData.total_reseñas > 0 && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Distribución de estrellas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Ratings</CardTitle>
                    <CardDescription>Desglose por cantidad de estrellas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ratingData.distribucion?.map((item) => (
                        <div key={item.estrellas} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-24">
                            <span className="font-semibold">{item.estrellas}</span>
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full"
                              style={{
                                width: `${(item.cantidad / ratingData.total_reseñas) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {item.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mejor valorados */}
                {ratingData.mejor_valorados?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Eventos Mejor Valorados</CardTitle>
                      <CardDescription>Top eventos con más reseñas positivas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {ratingData.mejor_valorados.map((evento) => (
                          <li key={evento.id} className="border-l-4 border-amber-500 pl-3 py-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <span className="font-semibold">{evento.titulo}</span>
                                <p className="text-xs text-muted-foreground">
                                  {evento.num_reseñas} reseñas
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="font-bold">{evento.rating_promedio}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Lista por usuario */}
            {porUsuario.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Eventos por Usuario</CardTitle>
                  <CardDescription>Participación individual de organizadores</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {porUsuario.slice(0, 10).map((u, i) => (
                      <li key={i} className="border-l-4 border-primary pl-3 py-1">
                        <span className="font-semibold">{u.username}</span>: {u.total} eventos
                      </li>
                    ))}
                    {porUsuario.length > 10 && (
                      <li className="text-sm text-muted-foreground pt-2">
                        Y {porUsuario.length - 10} usuarios más...
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Mensaje si no hay datos */}
            {!loading && porMes.length === 0 && porUsuario.length === 0 && porCategoria.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No hay datos disponibles. Crea algunos eventos para ver estadísticas.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}