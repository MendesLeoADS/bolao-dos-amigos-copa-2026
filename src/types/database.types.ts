export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jogos: {
        Row: {
          bandeira_a: string | null
          bandeira_b: string | null
          cidade: string | null
          data_hora: string
          estadio: string | null
          grupo: string | null
          id: number
          placar_a: number | null
          placar_b: number | null
          rodada: string | null
          status: string
          time_a: string
          time_b: string
        }
        Insert: {
          bandeira_a?: string | null
          bandeira_b?: string | null
          cidade?: string | null
          data_hora: string
          estadio?: string | null
          grupo?: string | null
          id: number
          placar_a?: number | null
          placar_b?: number | null
          rodada?: string | null
          status?: string
          time_a: string
          time_b: string
        }
        Update: {
          bandeira_a?: string | null
          bandeira_b?: string | null
          cidade?: string | null
          data_hora?: string
          estadio?: string | null
          grupo?: string | null
          id?: number
          placar_a?: number | null
          placar_b?: number | null
          rodada?: string | null
          status?: string
          time_a?: string
          time_b?: string
        }
        Relationships: []
      }
      palpites: {
        Row: {
          id: string
          jogo_id: number
          palpite_a: number
          palpite_b: number
          user_id: string
        }
        Insert: {
          id?: string
          jogo_id: number
          palpite_a: number
          palpite_b: number
          user_id: string
        }
        Update: {
          id?: string
          jogo_id?: number
          palpite_a?: number
          palpite_b?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          }
        ]
      }
      usuarios: {
        Row: {
          id: string
          senha:  string
          username: string
        }
        Insert: {
          id?: string
          senha: string
          username: string
        }
        Update: {
          id?: string
          senha?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
