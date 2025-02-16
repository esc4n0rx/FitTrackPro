"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Coffee, Apple, ForkKnife, Moon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DietForm } from "@/components/diet-form";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const mealsInfo: {
  key: keyof Diet["meals"];
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "cafe_da_manha", label: "Café da Manhã", Icon: Coffee },
  { key: "lanche_da_manha", label: "Lanche da Manhã", Icon: Apple },
  { key: "almoco", label: "Almoço", Icon: ForkKnife },
  { key: "lanche_da_tarde", label: "Lanche da Tarde", Icon: Coffee },
  { key: "jantar", label: "Jantar", Icon: Moon },
];

interface Diet {
  id: string;
  user_email: string;
  day: string;
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
  created_at: string;
  updated_at: string;
}

export default function DietPage() {
  const [diet, setDiet] = useState<Diet | null>(null);
  const [open, setOpen] = useState(false);

  const hoje = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    timeZone: "America/Sao_Paulo",
  };
  const dayName = hoje.toLocaleDateString("pt-BR", options);
  const diaCapitalizado = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setUserEmail(user?.email || null);
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchDiet();
    }
  }, [userEmail]);

  async function fetchDiet() {
    if (!userEmail) return;
    const { data, error } = await supabase
      .from("workout_diet")
      .select("*")
      .eq("user_email", userEmail)
      .eq("day", diaCapitalizado)
      .maybeSingle();
    if (error) {
      console.error("Erro ao buscar dieta:", error);
    } else {
      setDiet(data as Diet | null);
    }
  }

  async function concludeMeal(mealKey: keyof Diet["status"]) {
    if (!diet) return;
    const newStatus = { ...diet.status, [mealKey]: true };
    try {
      const { error } = await supabase
        .from("workout_diet")
        .update({ status: newStatus })
        .eq("id", diet.id);
      if (error) throw error;
      toast.success("Refeição concluída!");
      setDiet((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (error) {
      toast.error("Erro ao concluir refeição. Tente novamente.");
      console.error(error);
    }
  }

  const allMealsConcluded = diet
    ? Object.values(diet.status).every((value) => value === true)
    : false;

  return (
    <div className="container p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">
          Dieta - {diaCapitalizado}{" "}
          {allMealsConcluded && (
            <span className="text-green-500 font-bold">(Finalizado)</span>
          )}
        </h1>
        <div className="mt-4 md:mt-0">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Refeição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar/Editar Dieta - {diaCapitalizado}</DialogTitle>
              </DialogHeader>
              <DietForm
                day={diaCapitalizado}
                diet={diet}
                onSuccess={() => {
                  setOpen(false);
                  fetchDiet();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {diet ? (
          <Card>
            <CardHeader>
              <CardTitle>Dieta de {diaCapitalizado}</CardTitle>
            </CardHeader>
            <CardContent>
              {mealsInfo.map(({ key, label, Icon }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold">{label}</span>
                  </div>
                  <div className="flex-1 mx-2 text-right">
                    {(diet.meals[key] || []).join(", ") || "Nenhuma"}
                  </div>
                  <div>
                    {diet.status[key] ? (
                      <span className="text-green-500 font-bold">Concluído</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => concludeMeal(key)}
                      >
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dieta de {diaCapitalizado}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nenhuma refeição registrada para hoje.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
