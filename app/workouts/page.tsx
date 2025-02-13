"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WorkoutForm } from "@/components/workout-form";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  status?: string;
}

interface ExerciseProgress {
  completedSets: number;
  timer: number;
  timerActive: boolean;
}

export default function WorkoutsPage() {
  // Modal para adicionar novo treino
  const [addOpen, setAddOpen] = useState(false);
  // Modal para executar o treino (ao clicar em um card)
  const [executionOpen, setExecutionOpen] = useState(false);
  // Treino selecionado para execução
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  // Lista de treinos do usuário
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  // Email do usuário logado (armazenado no localStorage)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Progresso dos exercícios (por índice) para o treino ativo
  const [exerciseProgress, setExerciseProgress] = useState<{
    [key: number]: ExerciseProgress;
  }>({});
  // Indica se o treino foi completamente finalizado (todos os exercícios concluídos)
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // Referências para armazenar os timers de cada exercício
  const timerRefs = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  const router = useRouter();

  // Carrega o email do usuário do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setUserEmail(user?.email || null);
    }
  }, []);

  // Busca os treinos do usuário
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
      // Caso o treino em execução tenha sido excluído, fecha o modal
      if (activeWorkout?.id === id) {
        setExecutionOpen(false);
        setActiveWorkout(null);
      }
      fetchWorkouts();
    }
  }

  // Ao clicar num card, abre o modal de execução do treino
  function openWorkoutExecution(workout: Workout) {
    setActiveWorkout(workout);
    // Inicializa o progresso para cada exercício do treino
    const progress: { [key: number]: ExerciseProgress } = {};
    workout.exercises.forEach((ex, index) => {
      progress[index] = { completedSets: 0, timer: 0, timerActive: false };
    });
    setExerciseProgress(progress);
    setExecutionOpen(true);
  }

  function startTimerForExercise(index: number, duration: number) {
    setExerciseProgress((prev) => ({
      ...prev,
      [index]: { ...prev[index], timer: duration, timerActive: true },
    }));

    timerRefs.current[index] = setInterval(() => {
      setExerciseProgress((prev) => {
        const current = prev[index];
        if (current.timer <= 1) {
          clearInterval(timerRefs.current[index]!);
          return {
            ...prev,
            [index]: { ...current, timer: 0, timerActive: false },
          };
        }
        return {
          ...prev,
          [index]: { ...current, timer: current.timer - 1 },
        };
      });
    }, 1000);
  }

  function handleCompleteSet(exIndex: number, exercise: WorkoutExercise) {
    const progress = exerciseProgress[exIndex];
    if (progress.timerActive) return;

    if (progress.completedSets < exercise.sets) {
      const newCompleted = progress.completedSets + 1;
      setExerciseProgress((prev) => ({
        ...prev,
        [exIndex]: { ...prev[exIndex], completedSets: newCompleted },
      }));
      if (newCompleted < exercise.sets) {
        const restDuration = parseInt(exercise.rest) || 0;
        if (restDuration > 0) {
          startTimerForExercise(exIndex, restDuration);
        }
      }
    }
  }

  // Atualiza se o treino está completamente concluído
  useEffect(() => {
    if (activeWorkout) {
      const allComplete = activeWorkout.exercises.every((ex, index) => {
        const progress = exerciseProgress[index];
        return progress && progress.completedSets >= ex.sets;
      });
      setWorkoutCompleted(allComplete);
    }
  }, [exerciseProgress, activeWorkout]);

  async function finalizeWorkout() {
    if (!activeWorkout) return;
    const statusRecord = {
      id: crypto.randomUUID(),
      user_email: activeWorkout.user_email,
      day_of_week: activeWorkout.day_of_week,
      completed: true,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    };

    const { error: statusError } = await supabase
      .from("status_treino")
      .insert(statusRecord);

    if (statusError) {
      toast.error("Erro ao finalizar treino.");
      console.error(statusError);
    } else {
      const { error: updateError } = await supabase
        .from("workouts")
        .update({ status: "completed" })
        .eq("id", activeWorkout.id);
      if (updateError) console.error(updateError);
      toast.success("Treino concluído!");
      setExecutionOpen(false);
      setActiveWorkout(null);
      fetchWorkouts();
    }
  }

  return (
    <div className="container p-4 space-y-4">
      {/* Cabeçalho com opção para adicionar um novo treino */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treinos</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
            <WorkoutForm
              onSuccess={() => {
                setAddOpen(false);
                fetchWorkouts();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de treinos */}
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
              onClick={() => openWorkoutExecution(workout)}
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

      {/* Modal de execução do treino */}
      {activeWorkout && (
        <Dialog open={executionOpen} onOpenChange={setExecutionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeWorkout.day_of_week} - Treino {activeWorkout.status === "completed" && "✅"}
              </DialogTitle>
            </DialogHeader>
            <div>
              {activeWorkout.exercises.map((exercise, index) => {
                const progress = exerciseProgress[index];
                return (
                  <div key={index} className="border p-4 rounded mb-4">
                    <h3 className="text-lg font-bold">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets x {exercise.reps} reps
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span>
                        Concluídos: {progress?.completedSets}/{exercise.sets}
                      </span>
                      <Button
                        onClick={() => handleCompleteSet(index, exercise)}
                        disabled={progress?.timerActive || progress?.completedSets >= exercise.sets}
                      >
                        {progress?.completedSets >= exercise.sets ? "Concluído" : "Marcar Set Concluído"}
                      </Button>
                      {progress?.timerActive && (
                        <span className="text-sm">Descanso: {progress.timer}s</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {workoutCompleted && (
                <div className="mt-4">
                  <Button variant="destructive" onClick={finalizeWorkout}>
                    Finalizar Treino
                  </Button>
                </div>
              )}
              <div className="flex space-x-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push(`/workouts/edit/${activeWorkout.id}`);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Editar Treino
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await deleteWorkout(activeWorkout.id);
                    setExecutionOpen(false);
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" /> Excluir Treino
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
