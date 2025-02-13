"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().min(11, "O CPF deve conter 11 dígitos").max(11, "O CPF deve conter 11 dígitos"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  weight: z.preprocess((a) => Number(a), z.number({ invalid_type_error: "Peso deve ser um número" })),
  basalRate: z.preprocess((a) => Number(a), z.number({ invalid_type_error: "Taxa basal deve ser um número" })),
  trainingGoal: z.enum(["weight-loss", "muscle-gain", "maintenance", "endurance"]),
});

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showBasalCalculator, setShowBasalCalculator] = useState(false);
  const [calculatorAge, setCalculatorAge] = useState(30);
  const [calculatorHeight, setCalculatorHeight] = useState(170);
  const [calculatorGender, setCalculatorGender] = useState("male");

  const router = useRouter();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      password: "",
      weight: 0,
      basalRate: 0,
      trainingGoal: "maintenance",
    },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      router.push("/workouts");
      router.refresh();
    } catch (error) {
      toast.error("Falha ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    try {
      setIsLoading(true);
      
      console.log("Valores de registro:", values);
      
      const { error } = await supabase
        .from("user_profiles")
        .insert({
          name: values.name,
          cpf: values.cpf,
          email: values.email,
          password: values.password,
          weight: values.weight,
          basal_rate: values.basalRate,
          training_goal: values.trainingGoal,
        });

      if (error) {
        console.error("Erro ao registrar:", error);
        throw error;
      }

      router.push("/workouts");
      router.refresh();
    } catch (error) {
      toast.error("Falha ao criar conta. Por favor, tente novamente.");
      console.error("Erro no onRegister:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">FitTrack Pro</CardTitle>
          <CardDescription>
            Acompanhe sua jornada fitness e alcance seus objetivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Carregando..." : "Entrar"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678900" maxLength={11} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="basalRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa Basal (kcal)</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <Button variant="outline" type="button" onClick={() => setShowBasalCalculator(true)}>
                              Calcule aqui
                            </Button>
                          </div>
                          <FormMessage />
                          {showBasalCalculator && (
                            <Card className="mt-4 p-4">
                              <CardHeader>
                                <CardTitle>Calculadora de Taxa Basal</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Idade</label>
                                    <Input
                                      type="number"
                                      value={calculatorAge}
                                      onChange={(e) => setCalculatorAge(Number(e.target.value))}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Altura (cm)</label>
                                    <Input
                                      type="number"
                                      value={calculatorHeight}
                                      onChange={(e) => setCalculatorHeight(Number(e.target.value))}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Gênero</label>
                                    <select
                                      value={calculatorGender}
                                      onChange={(e) => setCalculatorGender(e.target.value)}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    >
                                      <option value="male">Masculino</option>
                                      <option value="female">Feminino</option>
                                    </select>
                                  </div>
                                  <Button
                                    variant="default"
                                    onClick={() => {
                                      const currentWeight = registerForm.getValues("weight");
                                      console.log(
                                        "Calculando taxa basal com - Peso:",
                                        currentWeight,
                                        "Idade:",
                                        calculatorAge,
                                        "Altura:",
                                        calculatorHeight,
                                        "Gênero:",
                                        calculatorGender
                                      );
                                      if (!currentWeight) {
                                        toast.error("Por favor, informe o peso para calcular a taxa basal");
                                        return;
                                      }
                                      let basal;
                                      if (calculatorGender === "male") {
                                        basal = Math.round((10 * currentWeight) + (6.25 * calculatorHeight) - (5 * calculatorAge) + 5);
                                      } else {
                                        basal = Math.round((10 * currentWeight) + (6.25 * calculatorHeight) - (5 * calculatorAge) - 161);
                                      }
                                      field.onChange(basal);
                                      setShowBasalCalculator(false);
                                    }}
                                  >
                                    Calcular
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="trainingGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo de Treino</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione seu objetivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weight-loss">Perda de Peso</SelectItem>
                            <SelectItem value="muscle-gain">Ganho de Massa</SelectItem>
                            <SelectItem value="maintenance">Manutenção</SelectItem>
                            <SelectItem value="endurance">Resistência</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Criando Conta..." : "Criar Conta"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
