"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface WorkoutExercise {
  name: string;
  category?: string;
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

const exerciseSchema = z.object({
  name: z.string().min(2, "O nome do exercício deve ter pelo menos 2 caracteres."),
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

export default function EditWorkoutPage() {
  const { id } = useParams(); 
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<Workout | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: "Segunda-feira",
      exercises: [{ name: "", category: "", sets: 1, reps: 1, weight: 0, rest: "60" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  useEffect(() => {
    async function fetchWorkout() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Erro ao buscar treino.");
        setLoading(false);
        return;
      }
      const workoutData = data as Workout;
      setWorkout(workoutData);
      form.reset({
        day: workoutData.day_of_week as "Segunda-feira" | "Terça-feira" | "Quarta-feira" | "Quinta-feira" | "Sexta-feira" | "Sábado" | "Domingo",
        exercises: workoutData.exercises as Array<z.infer<typeof exerciseSchema>>,
      });
      setLoading(false);      
    }
    fetchWorkout();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!id) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("workouts")
        .update({
          day_of_week: values.day,
          exercises: values.exercises,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Treino atualizado com sucesso!");
      router.push("/workouts");
    } catch (error) {
      toast.error("Erro ao atualizar treino.");
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Carregando...</div>;
  if (!workout) return <div>Treino não encontrado.</div>;

  return (
    <div className="container p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar Treino - {workout.day_of_week}</CardTitle>
        </CardHeader>
        <CardContent>
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

              {fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="border p-4 rounded mb-4">
                  <FormField
                    control={form.control}
                    name={`exercises.${index}.name` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Exercício</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Leg Press" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormLabel>Tempo de Descanso (seg)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button variant="destructive" onClick={() => remove(index)}>
                    Remover Exercício
                  </Button>
                </div>
              ))}

              <Button type="button" onClick={() => append({ name: "", category: "", sets: 1, reps: 1, weight: 0, rest: "60" })}>
                Adicionar Exercício
              </Button>

              <Button type="submit" className="w-full">
                Atualizar Treino
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
