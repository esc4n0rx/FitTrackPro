"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WorkoutForm } from "@/components/workout-form";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface WorkoutExercise {
  name: string;
  category: string;
  sets: number;
  reps: number;
  weight?: number;
  rest: string;
}

interface Workout {
  id: string;
  user_email: string;
  day_of_week: string;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
  // opcionalmente, podemos incluir um campo de status (ex: completed) se for incorporado no select
  status?: string;
}

export default function WorkoutsPage() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setUserEmail(user?.email || null);
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchWorkouts();
    }
  }, [userEmail]);

  async function fetchWorkouts() {
    if (!userEmail) return;

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_email", userEmail);

    if (error) {
      console.error("Erro ao buscar treinos:", error);
    } else {
      setWorkouts(data as Workout[]);
    }
  }

  async function deleteWorkout(id: string) {
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Erro ao excluir treino:", error);
    } else {
      fetchWorkouts();
    }
  }

  function handleCardClick(workout: Workout) {
    // Ao clicar (curto), inicia o treino
    // Exemplo: redireciona para uma página de execução do treino
    router.push(`/workouts/${workout.id}`);
  }

  function handleCardContextMenu(e: React.MouseEvent, workout: Workout) {
    e.preventDefault();
    // Abre modal de edição/exclusão
    setSelectedWorkout(workout);
    setEditOpen(true);
  }

  return (
    <div className="container p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treinos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Treino Completo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Treino Completo</DialogTitle>
            </DialogHeader>
            {/* Ao salvar, fecha o diálogo e atualiza a lista */}
            <WorkoutForm onSuccess={() => { setOpen(false); fetchWorkouts(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de Edição/Exclusão */}
      {selectedWorkout && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Treino - {selectedWorkout.day_of_week}</DialogTitle>
            </DialogHeader>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Redireciona para uma página de edição (por exemplo, /workouts/edit/[id])
                  router.push(`/workouts/edit/${selectedWorkout.id}`);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Editar Treino
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteWorkout(selectedWorkout.id);
                  setEditOpen(false);
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Excluir Treino
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid gap-4">
        {workouts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sem Treinos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Nenhum treino agendado</p>
            </CardContent>
          </Card>
        ) : (
          workouts.map((workout) => (
            <Card
              key={workout.id}
              onClick={() => handleCardClick(workout)}
              onContextMenu={(e) => handleCardContextMenu(e, workout)}
              className="cursor-pointer"
            >
              <CardHeader>
                <CardTitle>
                  {workout.day_of_week} {workout.status === "completed" ? "✅" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {workout.exercises.map((ex) => ex.name).join(", ")}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
