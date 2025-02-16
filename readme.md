# Fitrack Pro

Fitrack Pro é um Progressive Web App (PWA) desenvolvido com Next.js, Tailwind CSS e TypeScript, permitindo gerenciar seus treinos e refeições para um melhor controle e performance.

## 🚀 Funcionalidades

### 🏋️ Workout (Treinos)
- Adicione treinos separados por dia.
- Cada treino pode conter séries (sets) e repetições.
- Inicie um treino clicando nele para acompanhar sua execução.

### 🍽️ Diet (Refeições)
- O sistema reconhece o dia atual e permite adicionar até 5 refeições:
  - Café da manhã
  - Lanche da manhã
  - Almoço
  - Lanche da tarde
  - Jantar
- Marque refeições como concluídas conforme necessário.

### 📊 Reports (Relatórios) *(Em breve)*
- Implementação futura para controle aprimorado de treinos x refeições.

## 🛠️ Tecnologias Utilizadas
- **Next.js** - Framework React para aplicações web modernas.
- **Tailwind CSS** - Para estilização rápida e responsiva.
- **TypeScript** - Para tipagem segura e melhor manutenção do código.
- **Lucide React** - Biblioteca de ícones.
- **Zod** - Validação de dados.
- **Supabase** - Banco de dados e autenticação.

## 📌 Instalação e Execução
1. Clone o repositório:
   ```sh
   git clone https://github.com/esc4n0rx/FitTrackPro
   ```
2. Acesse o diretório do projeto:
   ```sh
   cd fitrack-pro
   ```
3. Instale as dependências:
   ```sh
   npm install
   ```
4. Configure as variáveis de ambiente para o Supabase no arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=URL_DO_SUPABASE
   NEXT_PUBLIC_SUPABASE_ANON_KEY=CHAVE_DO_SUPABASE
   ```
5. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```

## 📌 Deploy
Este projeto pode ser facilmente implantado em plataformas como Vercel.

## 📜 Licença
Este projeto é open-source e distribuído sob a licença MIT.

---
💪 **Fitrack Pro - Controle total dos seus treinos e refeições!**
