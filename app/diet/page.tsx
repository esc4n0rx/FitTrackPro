"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DietPage() {
  return (
    <div className="container p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dieta</h1>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Refeição
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Refeições de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhuma refeição registrada hoje</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
