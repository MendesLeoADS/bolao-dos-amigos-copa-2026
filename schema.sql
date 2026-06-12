-- Tabela de Usuários
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
);

-- Tabela de Jogos
CREATE TABLE public.jogos (
    id INT PRIMARY KEY,
    time_a TEXT NOT NULL,
    time_b TEXT NOT NULL,
    bandeira_a TEXT,
    bandeira_b TEXT,
    placar_a INT,
    placar_b INT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'AO_VIVO', 'ENCERRADO')),
    estadio TEXT,
    cidade TEXT,
    grupo TEXT,
    rodada TEXT
);

-- Tabela de Palpites
CREATE TABLE public.palpites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    jogo_id INT NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
    palpite_a INT NOT NULL,
    palpite_b INT NOT NULL,
    UNIQUE(user_id, jogo_id)
);

-- Inserir usuários iniciaveis (as senhas devem ser idênticas aos usernames conforme solicitado)
INSERT INTO public.usuarios (username, senha) VALUES
('léo', 'léo'),
('murilo', 'murilo'),
('ian', 'ian');

-- Função para validar a inserção/atualização de palpites
CREATE OR REPLACE FUNCTION check_palpite_time()
RETURNS TRIGGER AS $$
DECLARE
    jogo_data_hora TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Busca o horário do jogo associado a este palpite
    SELECT data_hora INTO jogo_data_hora
    FROM public.jogos
    WHERE id = NEW.jogo_id;

    -- Verifica se a data atual já passou de 5 minutos antes do início do jogo
    IF now() > (jogo_data_hora - interval '5 minutes') THEN
        RAISE EXCEPTION 'Tempo esgotado. O palpite só pode ser feito ou alterado até 5 minutos antes do início do jogo.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aplicar a regra antes de INSERT e UPDATE na tabela palpites
CREATE TRIGGER trg_check_palpite_time
BEFORE INSERT OR UPDATE ON public.palpites
FOR EACH ROW
EXECUTE FUNCTION check_palpite_time();

-- Ativar Row Level Security (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palpites ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Jogos: Leitura pública
CREATE POLICY "Leitura pública de jogos" ON public.jogos FOR SELECT USING (true);

-- Usuários: Leitura pública (para exibir os nomes de quem fez o palpite)
CREATE POLICY "Leitura pública de usuários" ON public.usuarios FOR SELECT USING (true);

-- Palpites:
-- Qualquer um pode ler os palpites
CREATE POLICY "Leitura pública de palpites" ON public.palpites FOR SELECT USING (true);

-- (Opcional) Apenas o dono pode atualizar/inserir. Mas como vamos usar service role ou validação customizada no backend Next.js,
-- a inserção pode ser controlada lá. Caso o backend faça via Service Role Key, ele bypassa RLS.
-- Mas deixaremos aberto para INSERT/UPDATE caso seja chamado com a key Anon e verificado no servidor, ou melhor, faremos tudo pelo backend (Next.js API route) para manter as senhas seguras.
-- Para simplificar o front com supabase.from('palpites'), precisaríamos do JWT. Como a auth é customizada, o ideal é o frontend bater numa Rota de API do Next.js, que usa a Service Role Key do Supabase para inserir/editar. Assim a Service Role burla o RLS e a segurança de 'quem é' fica no Next.js.
