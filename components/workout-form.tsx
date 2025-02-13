"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

// Agora o formulário inclui o campo para selecionar o dia da semana.
const formSchema = z.object({
  day: z.enum([
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ], {
    required_error: "Selecione um dia da semana."
  }),
  name: z.string().min(2, {
    message: "O nome do exercício deve ter pelo menos 2 caracteres.",
  }),
  category: z.string(),
  sets: z.coerce.number().min(1, { message: "Informe ao menos 1 set." }),
  reps: z.coerce.number().min(1, { message: "Informe ao menos 1 repetição." }),
  weight: z.coerce.number().optional(),
  rest: z.string(),
});

export function WorkoutForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: "Segunda-feira",
      name: "",
      category: "",
      sets: 1,
      reps: 1,
      weight: 0,
      rest: "60",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Obtém o e-mail do usuário logado (salvo no localStorage)
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || !user.email) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const userEmail = user.email;

    // Prepara o objeto do exercício
    const exercise = {
      name: values.name,
      category: values.category,
      sets: values.sets,
      reps: values.reps,
      weight: values.weight,
      rest: values.rest,
    };

    try {
      // Verifica se já existe um treino para o dia selecionado
      const { data: existing, error: fetchError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_email", userEmail)
        .eq("day_of_week", values.day)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Acrescenta o novo exercício ao array existente
        const newExercises = [...existing.exercises, exercise];
        const { error: updateError } = await supabase
          .from("workouts")
          .update({ exercises: newExercises })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        // Cria um novo registro de treino para o dia
        const newWorkout = {
          id: crypto.randomUUID(),
          user_email: userEmail,
          day_of_week: values.day,
          exercises: [exercise],
        };
        const { error: insertError } = await supabase
          .from("workouts")
          .insert(newWorkout);
        if (insertError) throw insertError;
      }
      toast.success("Exercício salvo com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar exercício. Tente novamente.");
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

        <FormField
          control={form.control}
          name="name"
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

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="upper">Membros Superiores</SelectItem>
                  <SelectItem value="lower">Membros Inferiores</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sets"
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
            name="reps"
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
          name="weight"
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
          name="rest"
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

        <Button type="submit" className="w-full">Salvar Exercício</Button>
      </form>
    </Form>
  );
}
