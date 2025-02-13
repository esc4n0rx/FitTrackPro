"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Seg', weight: 80 },
  { name: 'Ter', weight: 79.5 },
  { name: 'Qua', weight: 79.8 },
  { name: 'Qui', weight: 79.2 },
  { name: 'Sex', weight: 79.0 },
  { name: 'Sáb', weight: 78.8 },
  { name: 'Dom', weight: 78.5 },
];

export default function ReportsPage() {
  return (
    <div className="container p-4 space-y-4">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Progresso de Peso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
