$(info Running BUILD Makefile)

db: down
	docker compose up -d db
	sleep 5
	. ../../venv/Scripts/activate; python init-db.py

down:
	docker compose down

db-down:
	docker compose stop db
	docker compose rm -f db

workers:
	docker compose up -d --build django-workers 

server:
	docker compose up -d  --build django 