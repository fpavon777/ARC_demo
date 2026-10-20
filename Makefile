# ---------------------------------------------------------------------------
# ARC_demo - Genero BDL program with two front ends:
#   * GAS/GBC : the classic Genero Browser Client UI served by GAS
#   * ARC     : a React UI driven through the Arc gateway (typed contract)
#
#   make               compile main.4gl + forms into bin/ and refresh the Arc contract
#   make build         same as above
#   make contract      regenerate src/generated/<app>.ts (runs automatically
#                      whenever a .4gl or .per file is newer than the contract)
#   make run           run bin/main.42m through the Genero Desktop Client
#   make deploy-gas    build + write the GAS connector and make sure httpdispatch is up
#   make deploy-arc    build + production build of the React UI, copied to GAS web/
#   make deploy        deploy-gas + deploy-arc
#   make web-install   npm install
#   make web-dev       vite dev server (http://localhost:5173)
#   make check-gateway check that the Arc gateway answers
#   make clean         remove compiled output (bin/, dist/)
#
# Any edit to a .4gl/.per file recompiles it AND regenerates the Arc contract,
# because the contract and the React build depend on those sources.
# ---------------------------------------------------------------------------
FGLDIR     ?= /opt/fourjs/fgl
FGLASDIR   ?= /opt/fourjs/gas
APP        ?= arc_demo
MAIN       ?= main
GBC        ?=
GAS_PORT   ?= 6394
GATEWAY    ?= http://127.0.0.1:9000
GAS_APPDIR ?= $(FGLASDIR)/appdata/app
GAS_WEBDIR ?= $(FGLASDIR)/web/$(APP)

ROOT     := $(abspath .)
BIN      := $(ROOT)/bin
SRC4GL   := $(wildcard *.4gl)
SRCPER   := $(wildcard *.per)
# runtime resources the program reads from its working directory
RESOURCES ?= $(wildcard *.4st) file_1.json
CONTRACT := src/generated/$(APP).ts

MODULES := $(SRC4GL:%.4gl=$(BIN)/%.42m)
FORMS   := $(SRCPER:%.per=$(BIN)/%.42f)
RESOUT  := $(RESOURCES:%=$(BIN)/%)

export FGLDIR
export PATH := $(FGLDIR)/bin:$(FGLASDIR)/bin:$(PATH)

.PHONY: all build contract run deploy deploy-gas deploy-arc web-install web-dev \
        check-gateway clean

all: build

build: $(MODULES) $(FORMS) $(RESOUT) $(CONTRACT)

$(BIN):
	mkdir -p $(BIN)

# --- compile ----------------------------------------------------------------
$(BIN)/%.42m: %.4gl | $(BIN)
	fglcomp -M -o $(BIN) $<

$(BIN)/%.42f: %.per | $(BIN)
	fglform -M -o $(BIN) $<

$(BIN)/%: % | $(BIN)
	cp $< $@

# --- Arc contract: rebuilt when any .4gl or .per changes --------------------
contract: $(CONTRACT)

$(CONTRACT): $(MAIN).4gl $(SRCPER) scripts/generate-contract.mjs scripts/lib/bdl-contract.mjs
	node scripts/generate-contract.mjs $(APP) $@ $(MAIN).4gl $(SRCPER)

# --- run locally through GDC (env as in genv.sh) ----------------------------
run: build
	cd $(BIN) && FGLGUI=1 FGLPROFILE=$(ROOT)/fglprofile.universal FGLSERVER=$${FGLSERVER:-localhost:0} \
	  fglrun $(MAIN).42m

# --- GAS version (GBC) -------------------------------------------------------
deploy-gas: build
	bash scripts/write_xcf.sh "$(GAS_APPDIR)" "$(BIN)" "$(FGLDIR)" "$(APP)" "$(MAIN).42m" "$(GBC)"
	@if nc -z localhost $(GAS_PORT) >/dev/null 2>&1; then \
	  echo "   httpdispatch already listening on :$(GAS_PORT) - connector picked up automatically"; \
	else \
	  echo "   starting httpdispatch on :$(GAS_PORT) (log: /tmp/$(APP)-httpdispatch.log)"; \
	  ( cd "$(BIN)" && nohup httpdispatch > /tmp/$(APP)-httpdispatch.log 2>&1 < /dev/null & ); \
	  for _ in $$(seq 1 40); do nc -z localhost $(GAS_PORT) >/dev/null 2>&1 && break; sleep 0.5; done; \
	fi
	@echo "   GBC: http://localhost:$(GAS_PORT)/ua/r/$(APP)"

# --- ARC version (React) -----------------------------------------------------
web-install:
	npm install

web-dev: $(CONTRACT)
	npm run dev

# dist/ depends on the contract (hence on the 4GL/forms) and on the React sources
WEBSRC := $(shell find src index.html vite.config.ts package.json -type f 2>/dev/null)
dist/index.html: $(CONTRACT) $(WEBSRC)
	@test -f package.json -a -f index.html || { echo "no React app yet (index.html missing)"; exit 1; }
	npm run build

deploy-arc: build dist/index.html
	mkdir -p "$(GAS_WEBDIR)"
	rm -rf "$(GAS_WEBDIR)"/*
	cp -r dist/. "$(GAS_WEBDIR)"/
	@echo "   React UI: http://localhost:$(GAS_PORT)/$(APP)/index.html  (gateway: $(GATEWAY))"

deploy: deploy-gas deploy-arc

check-gateway:
	@curl -fsS -m 3 $(GATEWAY)/health && echo || { echo "Arc gateway not reachable at $(GATEWAY)"; exit 1; }

clean:
	rm -rf $(BIN) dist
