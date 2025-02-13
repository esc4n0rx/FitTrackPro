"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WorkoutForm } from "@/components/workout-form";
import { supabase } from "@/lib/supabase";

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
}

export default function WorkoutsPage() {
  const [open, setOpen] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userEmail = user?.email;

  useEffect(() => {
    if (userEmail) {
      fetchWorkouts();
    }
  }, [userEmail]);

  async function fetchWorkouts() {
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
              <DialogTitle>Adicionar Treino</DialogTitle>
            </DialogHeader>
  
            <WorkoutForm onSuccess={() => { setOpen(false); fetchWorkouts(); }} />
          </DialogContent>
        </Dialog>
      </div>

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
            <Card key={workout.id}>
              <CardHeader>
                <CardTitle>{workout.day_of_week}</CardTitle>
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
