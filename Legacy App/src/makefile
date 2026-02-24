$(info Running PARENT Makefile)

db:
	$(MAKE) -C build db 

migrate-db:
	$(MAKE) -C webserver/webserver migrate-db

db-down:
	$(MAKE) -C build db-down

workers:
	$(MAKE) -C build workers

server:
	$(MAKE) -C build server

down:
	$(MAKE) -C build down