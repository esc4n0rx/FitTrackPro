"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

/* ===========================
   Inline Edit Form Schema
   =========================== */
const exerciseSchema = z.object({
  exerciseId: z.string().optional(), // for pre-defined exercises from workouts_exercises
  customName: z.string().optional(), // if manual
  category: z.string().optional(),
  sets: z.coerce.number().min(1, { message: "Informe ao menos 1 set." }),
  reps: z.coerce.number().min(1, { message: "Informe ao menos 1 repetição." }),
  weight: z.coerce.number().optional(),
  rest: z.string(),
});
const formSchema = z.object({
  day: z.enum([
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ], { required_error: "Selecione um dia da semana." }),
  exercises: z.array(exerciseSchema).min(1, { message: "Adicione pelo menos um exercício." }),
});

export default function WorkoutsPage() {
  // Modal for adding a new workout
  const [addOpen, setAddOpen] = useState(false);
  // Modal for execution/editing of a workout
  const [executionOpen, setExecutionOpen] = useState(false);
  // Edit mode for inline editing in the execution modal
  const [editMode, setEditMode] = useState(false);
  // Active workout for execution/editing
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  // List of workouts of the user
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  // User email from localStorage
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Execution progress for the active workout
  const [exerciseProgress, setExerciseProgress] = useState<{ [key: number]: ExerciseProgress }>({});
  // Flag if the active workout is completed
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // Refs for timers
  const timerRefs = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  const router = useRouter();

  const { setValue } = useForm<EditFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: "Segunda-feira",
      exercises: [],
    },
  });
  

  // Load user email
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setUserEmail(user?.email || null);
    }
  }, []);

  // Fetch workouts
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
      if (activeWorkout?.id === id) {
        setExecutionOpen(false);
        setActiveWorkout(null);
      }
      fetchWorkouts();
    }
  }

  // Open execution modal and initialize progress
  function openWorkoutExecution(workout: Workout) {
    setActiveWorkout(workout);
    const progress: { [key: number]: ExerciseProgress } = {};
    workout.exercises.forEach((ex, index) => {
      progress[index] = { completedSets: 0, timer: 0, timerActive: false };
    });
    setExerciseProgress(progress);
    setExecutionOpen(true);
    setEditMode(false);
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
      // Update local state so that the workout appears as completed
      setActiveWorkout((prev) =>
        prev ? { ...prev, status: "completed" } : prev
      );
      fetchWorkouts();
    }
  }

  /* ================================
     Inline Edit Form (using react-hook-form)
     ================================ */
  type EditFormSchema = z.infer<typeof formSchema>;
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditFormSchema>({
    resolver: zodResolver(formSchema),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  useEffect(() => {
    if (editMode && activeWorkout) {
      const defaultValues: EditFormSchema = {
        day: activeWorkout.day_of_week as EditFormSchema["day"],
        exercises: activeWorkout.exercises.map((ex) => ({
          exerciseId: "manual",
          customName: ex.name,
          category: ex.category,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          rest: ex.rest,
        })),
      };
      reset(defaultValues);
    }
  }, [editMode, activeWorkout, reset]);
  
async function onEditSubmit(values: EditFormSchema) {
  if (!activeWorkout || !userEmail) return;
  // Map form values to WorkoutExercise[]
  const updatedExercises = values.exercises.map((ex) => ({
    // You can add additional logic here if needed (for example, lookup by exerciseId)
    name: ex.customName || "", // using customName as the exercise name
    category: ex.category || "",
    sets: ex.sets,
    reps: ex.reps,
    weight: ex.weight,
    rest: ex.rest,
  }));
  try {
    const { error } = await supabase
      .from("workouts")
      .update({
        day_of_week: values.day,
        exercises: updatedExercises,
      })
      .eq("id", activeWorkout.id);
    if (error) throw error;
    toast.success("Treino atualizado com sucesso!");
    setEditMode(false);
    // Update the active workout locally with the new values
    setActiveWorkout((prev) =>
      prev ? { ...prev, day_of_week: values.day, exercises: updatedExercises } : prev
    );
    fetchWorkouts();
  } catch (error) {
    toast.error("Erro ao atualizar treino.");
    console.error(error);
  }
}


  return (
    <div className="container p-4 space-y-4">
      {/* Header */}
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

      {/* List of Workouts */}
      <div className="grid gap-4">
        {workouts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sem Treinos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nenhum treino agendado
              </p>
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
                  {workout.day_of_week}{" "}
                  {workout.status === "completed" ? "✅" : ""}
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

      {/* Execution/Editing Modal */}
      {activeWorkout && (
        <Dialog open={executionOpen} onOpenChange={setExecutionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeWorkout.day_of_week} - Treino{" "}
                {activeWorkout.status === "completed" && "✅"}
              </DialogTitle>
            </DialogHeader>
            {activeWorkout.status === "completed" ? (
              <p className="text-center my-4">
                Este treino já foi concluído.
              </p>
            ) : editMode ? (
              // Inline Edit Mode
              <form
                onSubmit={handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium">
                    Dia da Semana
                  </label>
                  <select
                    {...register("day")}
                    className="mt-1 block w-full rounded-md border-gray-300"
                  >
                    <option value="Segunda-feira">Segunda-feira</option>
                    <option value="Terça-feira">Terça-feira</option>
                    <option value="Quarta-feira">Quarta-feira</option>
                    <option value="Quinta-feira">Quinta-feira</option>
                    <option value="Sexta-feira">Sexta-feira</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                  {errors.day && (
                    <p className="text-sm text-red-500">
                      {errors.day.message}
                    </p>
                  )}
                </div>
                {fields.map((fieldItem, index) => (
                  <div key={fieldItem.id} className="border p-4 rounded mb-4">
                    <div className="mb-2">
                      <label className="block text-sm font-medium">
                        Exercício (Selecione)
                      </label>
                      <Select
                            onValueChange={(val) =>
                              setValue(`exercises.${index}.exerciseId` as const, val)
                            }
                            defaultValue={fieldItem.exerciseId || undefined}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o exercício" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Leg Press</SelectItem>
                              <SelectItem value="2">Supino</SelectItem>
                              <SelectItem value="3">Cardio</SelectItem>
                              <SelectItem value="manual">Outro (Manual)</SelectItem>
                            </SelectContent>
                          </Select>
                    </div>
                    <div className="mb-2">
                      <FormLabel className="block text-sm font-medium">
                        Nome do Exercício (se manual)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome do exercício"
                          {...register(`exercises.${index}.customName` as const)}
                        />
                      </FormControl>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <FormLabel className="block text-sm font-medium">
                          Sets
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...register(`exercises.${index}.sets` as const)}
                          />
                        </FormControl>
                      </div>
                      <div>
                        <FormLabel className="block text-sm font-medium">
                          Reps
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...register(`exercises.${index}.reps` as const)}
                          />
                        </FormControl>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <FormLabel className="block text-sm font-medium">
                          Peso (Kg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            {...register(`exercises.${index}.weight` as const)}
                          />
                        </FormControl>
                      </div>
                      <div>
                        <FormLabel className="block text-sm font-medium">
                          Descanso (seg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="15"
                            {...register(`exercises.${index}.rest` as const)}
                          />
                        </FormControl>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => remove(index)}
                    >
                      Remover Exercício
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() =>
                    append({
                      exerciseId: "manual",
                      customName: "",
                      sets: 1,
                      reps: 1,
                      weight: 0,
                      rest: "60",
                    })
                  }
                >
                  Adicionar Exercício
                </Button>
                <Button type="submit" className="w-full mt-4">
                  Atualizar Treino
                </Button>
              </form>
            ) : (
              // Execution Mode (non-edit)
              <>
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
                          disabled={
                            progress?.timerActive ||
                            progress?.completedSets >= exercise.sets
                          }
                        >
                          {progress?.completedSets >= exercise.sets
                            ? "Concluído"
                            : "Marcar Set Concluído"}
                        </Button>
                        {progress?.timerActive && (
                          <span className="text-sm">
                            Descanso: {progress.timer}s
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {workoutCompleted && (
                  <div className="mt-4">
                    <Button
                      variant="destructive"
                      onClick={finalizeWorkout}
                    >
                      Finalizar Treino
                    </Button>
                  </div>
                )}
              </>
            )}
            {/* Buttons to toggle edit mode or delete */}
            <div className="flex space-x-4 mt-4">
              {!editMode && activeWorkout?.status !== "completed" && (
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Editar Treino
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={async () => {
                  if (activeWorkout) {
                    await deleteWorkout(activeWorkout.id);
                    setExecutionOpen(false);
                  }
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Excluir Treino
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
