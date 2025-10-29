############################################################
# CONFIGURAÇÕES
############################################################

# Nome do serviço principal da aplicação (NestJS)
APP=dev_app

# Arquivos base (for dev and prod)
COMPOSE_BASE=docker-compose.yml

# Arquivos adicionais
COMPOSE_OVERRIDE=docker-compose.override.yml
COMPOSE_PROD=docker-compose.prod.yml

# Função helper para rodar docker compose dinamicamente
DC=docker compose -f $(COMPOSE_BASE)

############################################################
# ALIASES
############################################################

.PHONY: up-dev up-dev-no-build up-prod down restart logs sh \
        migrate seed generate reset-prisma stop clean help info

############################################################
# DOCKER COMPOSE - AMBIENTE DEV
############################################################

up-dev-no-build:
	@echo "🚀 Subindo containers DEV sem build..."
	$(DC) -f $(COMPOSE_OVERRIDE) up -d

up-dev:
	@echo "🔥 Subindo containers DEV com build (hot reload)..."
	$(DC) -f $(COMPOSE_OVERRIDE) up -d --build

############################################################
# DOCKER COMPOSE - AMBIENTE PROD
############################################################

up-prod:
	@echo "🏭 Subindo containers PROD (sem hot reload)..."
	$(DC) -f $(COMPOSE_PROD) up -d --build

############################################################
# CONTROLE DOS CONTAINERS
############################################################

down:
	@echo "🛑 Parando containers..."
	$(DC) down

restart:
	@echo "♻️ Reiniciando containers..."
	$(DC) restart

logs:
	@echo "📜 Logs do serviço ($(APP))..."
	$(DC) logs -f $(APP)

sh:
	@echo "🔗 Entrando no container ($(APP))..."
	docker exec -it $(APP) sh

stop:
	@echo "⏹️  Stop nos containers..."
	$(DC) stop

clean:
	@echo "🔥 Limpando containers, volumes e imagens..."
	$(DC) down -v --rmi all --remove-orphans

############################################################
# PRISMA
############################################################

migrate:
	@echo "📦 Rodando migrations..."
	docker exec -it $(APP) npx prisma migrate dev

seed:
	@echo "🌱 Rodando seeds..."
	docker exec -it $(APP) npx prisma db seed

generate:
	@echo "⚙️ Gerando Prisma Client..."
	docker exec -it $(APP) npx prisma generate

reset-prisma:
	@echo "🧨 Resetando banco + prisma..."
	docker exec -it $(APP) npx prisma migrate reset

############################################################
# HELP / INFO
############################################################

help:
	@echo ""
	@echo " 📌 Comandos disponíveis:"
	@echo ""
	@echo "   make up-dev           -> subir ambiente DEV"
	@echo "   make up-prod          -> subir ambiente PROD"
	@echo "   make down             -> derrubar tudo"
	@echo "   make logs             -> ver logs do app"
	@echo "   make sh               -> entrar no container"
	@echo ""
	@echo " 🔧 Prisma:"
	@echo "   make migrate          -> rodar migrations"
	@echo "   make generate         -> gerar client"
	@echo "   make seed             -> rodar seeds"
	@echo "   make reset-prisma     -> reset banco e migrations"
	@echo ""
	@echo " 🔥 Modo RADICAL:"
	@echo "   make clean            -> apagar containers, imagens e volumes"
	@echo ""

info:
	@echo "APP:               $(APP)"
	@echo "Compose Base:      $(COMPOSE_BASE)"
	@echo "Compose Override:  $(COMPOSE_OVERRIDE)"
	@echo "Compose PROD:      $(COMPOSE_PROD)"
