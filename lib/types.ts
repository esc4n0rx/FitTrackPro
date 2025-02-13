// types.ts
export interface WorkoutExercise {
    name: string;
    category: string;
    sets: number;
    reps: number;
    weight?: number;
    rest: string;
  }
  
  export interface Workout {
    id: string;
    user_email: string;
    day_of_week: string;
    exercises: WorkoutExercise[];
    created_at: string;
    updated_at: string;
    status?: string;
  }
  