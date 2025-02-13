// workouts/[id]/page.tsx (Server Component)
import { notFound } from "next/navigation";
import WorkoutExecutionClient from "../[id]/WorkoutExecutionClient";
import { createServerClient } from "@/lib/supabase";
import type { Workout } from "@/lib/types"; 

export default async function WorkoutPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const workout = data as Workout;
  return <WorkoutExecutionClient workout={workout} />;
}

// Mesmo que não gere parâmetros estáticos, para evitar o erro de export estática:
export async function generateStaticParams() {
  return []; // ou implemente a lógica para retornar todos os IDs se necessário
}
