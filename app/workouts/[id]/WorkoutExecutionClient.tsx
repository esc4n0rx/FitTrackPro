"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Workout, WorkoutExercise } from "@/lib/types";

interface ExerciseProgress {
  completedSets: number;
  timer: number;
  timerActive: boolean;
}

interface WorkoutExecutionClientProps {
  workout: Workout;
}

export default function WorkoutExecutionClient({ workout }: WorkoutExecutionClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState<{ [key: number]: ExerciseProgress }>({});
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // Referência para armazenar os timers de cada exercício
  const timerRefs = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  useEffect(() => {
    // Inicializa o progresso para cada exercício
    const progress: { [key: number]: ExerciseProgress } = {};
    workout.exercises.forEach((ex: WorkoutExercise, index: number) => {
      progress[index] = { completedSets: 0, timer: 0, timerActive: false };
    });
    setExerciseProgress(progress);
  }, [workout.exercises]);

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
      // Se não for o último set, inicia o cronômetro de descanso
      if (newCompleted < exercise.sets) {
        const restDuration = parseInt(exercise.rest) || 0;
        if (restDuration > 0) {
          startTimerForExercise(exIndex, restDuration);
        }
      }
    }
  }

  useEffect(() => {
    // Verifica se todos os exercícios foram concluídos
    const allComplete = workout.exercises.every((ex, index) => {
      const progress = exerciseProgress[index];
      return progress && progress.completedSets >= ex.sets;
    });
    setWorkoutCompleted(allComplete);
  }, [exerciseProgress, workout.exercises]);

  async function finalizeWorkout() {
    if (!workout) return;
    setLoading(true);
    const statusRecord = {
      id: crypto.randomUUID(),
      user_email: workout.user_email,
      day_of_week: workout.day_of_week,
      completed: true,
      started_at: new Date().toISOString(), // Em um cenário real, armazene o início real
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
    setLoading(false);
  }

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
              <Button variant="destructive" onClick={finalizeWorkout} disabled={loading}>
                Finalizar Treino
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
