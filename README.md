# NeuroElo 🧠

O **NeuroElo** é uma plataforma inovadora projetada para conectar famílias e profissionais de saúde no acompanhamento de pacientes neurodivergentes. Nosso objetivo é centralizar informações críticas, como medicação, rotina e eventos comportamentais, em um "Prontuário Digital" acessível e intuitivo.

## 🚀 Funcionalidades Principais

- **Prontuário Digital:** Histórico completo do paciente acessível por profissionais autorizados.
- - **Gestão de Medicamentos:** Controle rigoroso de horários, dosagens e estoque.
  - - **Registro de Eventos:** Monitoramento de gatilhos, comportamentos e crises em tempo real.
    - - **Geolocalização:** Acompanhamento seguro da localização do paciente.
      - - **Dashboard para Profissionais:** Visão analítica para médicos, terapeutas e educadores.
        - - **Segurança Avançada:** Proteção de dados sensíveis utilizando Row Level Security (RLS) do Supabase.
         
          - ## 🛠️ Tecnologias Utilizadas
         
          - - **Frontend:** React + TypeScript + Vite
            - - **Estilização:** Tailwind CSS + shadcn/ui
              - - **Backend/Banco de Dados:** Supabase (PostgreSQL, Auth, Realtime)
                - - **Gerenciamento de Estado:** React Context API
                  - - **Ícones:** Lucide React
                   
                    - ## 📦 Como Rodar o Projeto Localmente
                   
                    - ### Pré-requisitos
                    - - Node.js (v18 ou superior)
                      - - npm ou yarn
                       
                        - ### Passo a Passo
                       
                        - 1. **Clone o repositório:**
                          2.    ```bash
                                   git clone https://github.com/toribakush/NeuroElo.git
                                   cd NeuroElo
                                   ```

                                2. **Instale as dependências:**
                                3.    ```bash
                                         npm install
                                         ```

                                      3. **Configure as variáveis de ambiente:**
                                      4.    - Renomeie o arquivo `.env.example` para `.env`.
                                            -    - Adicione suas chaves do Supabase (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
                                             
                                                 - 4. **Inicie o servidor de desenvolvimento:**
                                                   5.    ```bash
                                                            npm run dev
                                                            ```

                                                         5. **Acesse no navegador:**
                                                         6.    O projeto estará rodando em `http://localhost:5173`.
                                                     
                                                         7.## 🔒 Segurança e Privacidade

                                                     O NeuroElo leva a sério a privacidade dos dados de saúde. Utilizamos as melhores práticas de segurança, incluindo:
                                                   - Autenticação robusta via Supabase Auth.
                                                   - - Políticas de RLS para garantir que apenas usuários autorizados acessem dados específicos.
                                                     - - Variáveis de ambiente protegidas para chaves de API.
                                                      
                                                       - ---

                                                       Desenvolvido com ❤️ para transformar o cuidado neurodivergente.
                                                       
