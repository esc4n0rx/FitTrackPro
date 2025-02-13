"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  status?: string;
}

interface ExerciseProgress {
  completedSets: number;
  timer: number;
  timerActive: boolean;
}

export default function WorkoutExecutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseProgress, setExerciseProgress] = useState<{ [key: number]: ExerciseProgress }>({});
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  const timerRefs = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  useEffect(() => {
    async function fetchWorkout() {
      setLoading(true);
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        toast.error("Erro ao buscar treino");
        console.error(error);
      } else if (data) {
        setWorkout(data as Workout);
        const progress: { [key: number]: ExerciseProgress } = {};
        (data as Workout).exercises.forEach((ex: WorkoutExercise, index: number) => {
          progress[index] = { completedSets: 0, timer: 0, timerActive: false };
        });
        setExerciseProgress(progress);
      }
      setLoading(false);
    }
    if (id) {
      fetchWorkout();
    }
  }, [id]);

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

  useEffect(() => {
    if (workout) {
      const allComplete = workout.exercises.every((ex, index) => {
        const progress = exerciseProgress[index];
        return progress && progress.completedSets >= ex.sets;
      });
      setWorkoutCompleted(allComplete);
    }
  }, [exerciseProgress, workout]);

  async function finalizeWorkout() {
    if (!workout) return;
    const statusRecord = {
      id: crypto.randomUUID(),
      user_email: workout.user_email,
      day_of_week: workout.day_of_week,
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
        .eq("id", workout.id);
      if (updateError) console.error(updateError);
      toast.success("Treino concluído!");
      router.push("/workouts");
    }
  }

  if (loading) return <div>Carregando...</div>;
  if (!workout) return <div>Treino não encontrado.</div>;

  return (
    <div className="container p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {workout.day_of_week} - Treino {workout.status === "completed" && "✅"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workout.exercises.map((exercise, index) => {
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
              <Button variant="default" onClick={finalizeWorkout}>
                Finalizar Treino
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
