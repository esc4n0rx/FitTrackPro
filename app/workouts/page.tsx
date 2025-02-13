"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WorkoutForm } from "@/components/workout-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function WorkoutsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treinos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Treino
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Exercício</DialogTitle>
            </DialogHeader>
            <WorkoutForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Treino de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum treino agendado para hoje</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
