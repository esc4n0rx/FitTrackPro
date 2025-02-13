"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

// Schema for an exercise
const exerciseSchema = z.object({
  exerciseId: z.string().optional(), // Pre-defined exercise ID from workouts_exercises
  customName: z.string().optional(), // if manual
  category: z.string().optional(),
  sets: z.coerce.number().min(1, { message: "Informe ao menos 1 set." }),
  reps: z.coerce.number().min(1, { message: "Informe ao menos 1 repetição." }),
  weight: z.coerce.number().optional(),
  rest: z.string(),
});

// Main form schema
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

export function WorkoutForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: "Segunda-feira",
      exercises: [
        { exerciseId: "manual", customName: "", sets: 1, reps: 1, weight: 0, rest: "60" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  // Watch the entire exercises array so we can decide when to show the custom name field
  const exercisesWatch = useWatch({
    control: form.control,
    name: "exercises",
  });

  const [exercisesOptions, setExercisesOptions] = useState<any[]>([]);
  useEffect(() => {
    async function fetchExercises() {
      const { data, error } = await supabase.from("workouts_exercises").select("*");
      if (error) {
        console.error("Erro ao buscar exercícios:", error);
      } else {
        setExercisesOptions(data || []);
      }
    }
    fetchExercises();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Get the logged-in user's email
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || !user.email) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const userEmail = user.email;

    // Process each exercise: if selected via table, use the corresponding name;
    // otherwise, use the manually entered value.
    const processedExercises = values.exercises.map((ex) => ({
      name:
        ex.exerciseId && ex.exerciseId !== "manual"
          ? (exercisesOptions.find((opt) => opt.id === Number(ex.exerciseId))?.nome_exercise || ex.customName)
          : ex.customName,
      category: ex.category,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      rest: ex.rest,
    }));

    try {
      // Check if a workout for the day already exists
      const { data: existing, error: fetchError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_email", userEmail)
        .eq("day_of_week", values.day)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const newExercises = [...existing.exercises, ...processedExercises];
        const { error: updateError } = await supabase
          .from("workouts")
          .update({ exercises: newExercises })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        const newWorkout = {
          id: crypto.randomUUID(),
          user_email: userEmail,
          day_of_week: values.day,
          exercises: processedExercises,
        };
        const { error: insertError } = await supabase
          .from("workouts")
          .insert(newWorkout);
        if (insertError) throw insertError;
      }
      toast.success("Treino salvo com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar treino. Tente novamente.");
      console.error("Erro no WorkoutForm:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dia da Semana</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Segunda-feira">Segunda-feira</SelectItem>
                  <SelectItem value="Terça-feira">Terça-feira</SelectItem>
                  <SelectItem value="Quarta-feira">Quarta-feira</SelectItem>
                  <SelectItem value="Quinta-feira">Quinta-feira</SelectItem>
                  <SelectItem value="Sexta-feira">Sexta-feira</SelectItem>
                  <SelectItem value="Sábado">Sábado</SelectItem>
                  <SelectItem value="Domingo">Domingo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Each exercise is wrapped in a collapsible <details> */}
        {fields.map((fieldItem, index) => (
          <details key={fieldItem.id} className="border p-4 rounded mb-4">
            <summary className="cursor-pointer font-semibold">
              Exercício {index + 1}:{" "}
              {exercisesWatch[index]?.exerciseId !== "manual"
                ? exercisesOptions.find(
                    (opt) =>
                      opt.id.toString() === exercisesWatch[index]?.exerciseId
                  )?.nome_exercise || "Selecione"
                : "Outro (Manual)"}
            </summary>
            <div className="mt-2 space-y-4">
              <FormField
                control={form.control}
                name={`exercises.${index}.exerciseId` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercício (Selecione)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "manual"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o exercício" />
                      </SelectTrigger>
                      <SelectContent>
                        {exercisesOptions.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={option.id.toString()}
                          >
                            {option.nome_exercise}
                          </SelectItem>
                        ))}
                        <SelectItem value="manual">
                          Outro (Manual)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Only render the custom name field if the selected exercise is "manual" */}
              {exercisesWatch[index]?.exerciseId === "manual" && (
                <FormField
                  control={form.control}
                  name={`exercises.${index}.customName` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Exercício (se manual)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome do exercício"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`exercises.${index}.sets` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sets</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`exercises.${index}.reps` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reps</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`exercises.${index}.weight` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`exercises.${index}.rest` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descanso (seg)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button variant="destructive" onClick={() => remove(index)}>
                Remover Exercício
              </Button>
            </div>
          </details>
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

        <Button type="submit" className="w-full">
          Salvar Treino
        </Button>
      </form>
    </Form>
  );
}
