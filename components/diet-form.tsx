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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const dietSchema = z.object({
  day: z.string(),
  cafe_da_manha: z.string().optional(),
  lanche_da_manha: z.string().optional(),
  almoco: z.string().optional(),
  lanche_da_tarde: z.string().optional(),
  jantar: z.string().optional(),
});

type DietFormSchema = z.infer<typeof dietSchema>;

interface DietFormProps {
  day: string;
  diet?: {
    id: string;
    meals: {
      cafe_da_manha?: string[];
      lanche_da_manha?: string[];
      almoco?: string[];
      lanche_da_tarde?: string[];
      jantar?: string[];
    };
    status: {
      cafe_da_manha: boolean;
      lanche_da_manha: boolean;
      almoco: boolean;
      lanche_da_tarde: boolean;
      jantar: boolean;
    };
  } | null;
  onSuccess: () => void;
}

export function DietForm({ day, diet, onSuccess }: DietFormProps) {
  const methods = useForm<DietFormSchema>({
    resolver: zodResolver(dietSchema),
    defaultValues: {
      day,
      cafe_da_manha: "",
      lanche_da_manha: "",
      almoco: "",
      lanche_da_tarde: "",
      jantar: "",
    },
  });

  useEffect(() => {
    if (diet) {
      methods.reset({
        day,
        cafe_da_manha: diet.meals.cafe_da_manha?.join(", ") || "",
        lanche_da_manha: diet.meals.lanche_da_manha?.join(", ") || "",
        almoco: diet.meals.almoco?.join(", ") || "",
        lanche_da_tarde: diet.meals.lanche_da_tarde?.join(", ") || "",
        jantar: diet.meals.jantar?.join(", ") || "",
      });
    }
  }, [diet, day, methods.reset]);

  async function onSubmit(values: DietFormSchema) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || !user.email) {
      toast.error("Usuário não autenticado.");
      return;
    }
    const userEmail = user.email;

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("workout_diet")
        .select("*")
        .eq("user_email", userEmail)
        .eq("day", day)
        .maybeSingle();
      if (fetchError) throw fetchError;

      const meals = {
        cafe_da_manha: values.cafe_da_manha
          ? values.cafe_da_manha.split(",").map((item) => item.trim()).filter((item) => item)
          : [],
        lanche_da_manha: values.lanche_da_manha
          ? values.lanche_da_manha.split(",").map((item) => item.trim()).filter((item) => item)
          : [],
        almoco: values.almoco
          ? values.almoco.split(",").map((item) => item.trim()).filter((item) => item)
          : [],
        lanche_da_tarde: values.lanche_da_tarde
          ? values.lanche_da_tarde.split(",").map((item) => item.trim()).filter((item) => item)
          : [],
        jantar: values.jantar
          ? values.jantar.split(",").map((item) => item.trim()).filter((item) => item)
          : [],
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from("workout_diet")
          .update({ meals, status: { cafe_da_manha: false, lanche_da_manha: false, almoco: false, lanche_da_tarde: false, jantar: false } })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        const newDiet = {
          id: crypto.randomUUID(),
          user_email: userEmail,
          day,
          meals,
          status: { cafe_da_manha: false, lanche_da_manha: false, almoco: false, lanche_da_tarde: false, jantar: false },
        };
        const { error: insertError } = await supabase
          .from("workout_diet")
          .insert(newDiet);
        if (insertError) throw insertError;
      }
      toast.success("Dieta salva com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar dieta. Tente novamente.");
      console.error("Erro no DietForm:", error);
    }
  }

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <FormLabel className="block text-sm font-medium">
              Café da Manhã
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Café, ovos, pão"
                {...methods.register("cafe_da_manha")}
              />
            </FormControl>
            <FormMessage />
          </div>
          <div>
            <FormLabel className="block text-sm font-medium">
              Lanche da Manhã
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Fruta, iogurte"
                {...methods.register("lanche_da_manha")}
              />
            </FormControl>
            <FormMessage />
          </div>
          <div>
            <FormLabel className="block text-sm font-medium">
              Almoço
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Arroz, feijão, carne"
                {...methods.register("almoco")}
              />
            </FormControl>
            <FormMessage />
          </div>
          <div>
            <FormLabel className="block text-sm font-medium">
              Lanche da Tarde
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Sanduíche, suco"
                {...methods.register("lanche_da_tarde")}
              />
            </FormControl>
            <FormMessage />
          </div>
          <div>
            <FormLabel className="block text-sm font-medium">
              Jantar
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Salada, sopa"
                {...methods.register("jantar")}
              />
            </FormControl>
            <FormMessage />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Salvar Dieta
        </Button>
      </form>
    </Form>
  );
}
