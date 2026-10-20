# ---------------------------------------------------------------------------
# ARC_demo - Genero BDL program with two front ends:
#   * GAS/GBC : the classic Genero Browser Client UI served by GAS
#   * ARC     : a React UI driven through the Arc gateway (typed contract)
#
#   make               compile main.4gl + forms into bin/ and refresh the Arc contract
#   make build         same as above
#   make strings-extract
#                      list the translatable keys found in the sources
#   make i18n          regenerate src/generated/i18n.ts (dictionary of the React UI)
#   make contract      regenerate src/generated/<app>.ts (runs automatically
#                      whenever a .4gl or .per file is newer than the contract)
#   make run           run bin/main.42m through the Genero Desktop Client
#   make deploy-gas    build + write the GAS connector and make sure httpdispatch is up
#   make deploy-arc    build + production build of the React UI, copied to GAS web/
#   make deploy        deploy-gas + deploy-arc
#   make web-install   npm install
#   make web-dev       vite dev server (http://localhost:5173)
#   make check-gateway check that the Arc gateway answers
#   make gateway-install   install and start the Arc gateway as a systemd user service
#   make gateway-start|gateway-stop|gateway-restart|gateway-status|gateway-logs|gateway-uninstall
#                      manage that service (it starts with your session and restarts on failure)
#   make gateway-ensure start the gateway if it is not answering (used by deploy-arc)
#   make clean         remove compiled output (bin/, dist/)
#
# Languages: every strings/<lang>/ directory listed in LANGS is compiled into bin/<lang>/
# (arc_demo.42s). The program picks one per session at start (lib_idioma),
# so one build serves all languages. deploy-gas writes one connector per language
# (<app>_<lang>.xcf, language as program argument): the React UI opens the one it needs.
#
# Any edit to a .4gl/.per file recompiles it AND regenerates the Arc contract,
# because the contract and the React build depend on those sources.
# ---------------------------------------------------------------------------
FGLDIR     ?= /opt/fourjs/fgl
FGLASDIR   ?= /opt/fourjs/gas
APP        ?= arc_demo
MAIN       ?= main
APPMOD     ?= app_demo
GBC        ?=
LANGS      ?= es en
GAS_PORT   ?= 6394
GATEWAY    ?= http://127.0.0.1:9000
# Arc gateway service: checkout of the Arc monorepo, port, and name of the systemd user unit
ARC_GATEWAY_DIR ?= $(abspath ../arc-monorepo)
GATEWAY_PORT    ?= $(lastword $(subst :, ,$(GATEWAY)))
GATEWAY_UNIT    ?= arc-gateway
# Node used by the service: "lts" (default) = the newest LTS installed in nvm, looked up at every
# (re)start; or "path" = the node found now (NODE, default the one in your PATH).
GATEWAY_NODE    ?= lts
NVM_DIR         ?= $(HOME)/.nvm
NODE            ?= $(shell command -v node)
GAS_APPDIR ?= $(FGLASDIR)/appdata/app
GAS_WEBDIR ?= $(FGLASDIR)/web/$(APP)

ROOT     := $(abspath .)
BIN      := $(ROOT)/bin
SRC4GL   := $(wildcard *.4gl)
SRCPER   := $(wildcard *.per)
# runtime resources the program reads from its working directory
RESOURCES ?= $(wildcard *.4st) file_1.json fglprofile default.4ad
CONTRACT := src/generated/$(APP).ts
I18N     := src/generated/i18n.ts

MODULES := $(SRC4GL:%.4gl=$(BIN)/%.42m)
FORMS   := $(SRCPER:%.per=$(BIN)/%.42f)
LANGOUT := $(foreach l,$(LANGS),$(BIN)/$(l)/arc_demo.42s)
RESOUT  := $(RESOURCES:%=$(BIN)/%) $(LANGOUT)

export FGLDIR
# library modules (INITIALIZER = lib_paises.xxx) are found in bin/ at compile and run time
export FGLLDPATH := $(BIN)
export PATH := $(FGLDIR)/bin:$(FGLASDIR)/bin:$(PATH)

.PHONY: all build contract i18n strings-extract run deploy deploy-gas deploy-arc web-install web-dev \
        check-gateway gateway-install gateway-uninstall gateway-start gateway-stop gateway-restart gateway-status \
        gateway-logs gateway-ensure clean

all: build

build: $(MODULES) $(FORMS) $(RESOUT) $(CONTRACT) $(I18N)

$(BIN):
	mkdir -p $(BIN)

# --- compile ----------------------------------------------------------------
$(BIN)/%.42m: %.4gl | $(BIN)
	fglcomp -M -o $(BIN) $<

$(BIN)/%.42f: %.per | $(BIN)
	fglform -M -o $(BIN) $<

$(BIN)/%: % | $(BIN)
	cp $< $@

# --- translatable strings ----------------------------------------------------
# one directory per language: bin/<lang>/arc_demo.42s (from the .str). The default action
# texts (default.4ad) are not duplicated: their <LStr> keys live in the same .str files.
define lang_rules
$(BIN)/$(1)/arc_demo.42s: strings/$(1)/arc_demo.str
	mkdir -p $(BIN)/$(1)
	cp $$< $(BIN)/$(1)/arc_demo.str
	cd $(BIN)/$(1) && fglmkstr arc_demo.str && rm arc_demo.str
endef
$(foreach l,$(LANGS),$(eval $(call lang_rules,$(l))))

# the main module needs the modules it imports compiled first
$(BIN)/$(MAIN).42m: $(BIN)/$(APPMOD).42m $(BIN)/lib_idioma.42m

# dictionary of the React UI, from the same .str files the 4GL uses
i18n: $(I18N)
$(I18N): $(foreach l,$(LANGS),strings/$(l)/arc_demo.str) scripts/generate-i18n.mjs
	node scripts/generate-i18n.mjs $@ $(LANGS)

# Keys the sources ask for: start (or check) strings/<language>/arc_demo.str with them
strings-extract:
	@{ for f in $(SRCPER); do fglform -m $$f; done; for f in $(SRC4GL); do fglcomp -m $$f; done; } | sort -u

# --- Arc contract: rebuilt when any .4gl or .per changes --------------------
contract: $(CONTRACT)

$(CONTRACT): $(APPMOD).4gl $(SRCPER) scripts/generate-contract.mjs scripts/lib/bdl-contract.mjs
	node scripts/generate-contract.mjs $(APP) $@ $(APPMOD).4gl $(SRCPER)

# --- run locally through GDC (env as in genv.sh) ----------------------------
run: build
	cd $(BIN) && FGLGUI=1 FGLRESOURCEPATH=$(BIN)/$(firstword $(LANGS)) FGLPROFILE=$(ROOT)/fglprofile.universal FGLSERVER=$${FGLSERVER:-localhost:0} \
	  fglrun $(MAIN).42m

# --- GAS version (GBC) -------------------------------------------------------
deploy-gas: build
	bash scripts/write_xcf.sh "$(GAS_APPDIR)" "$(BIN)" "$(FGLDIR)" "$(APP)" "$(MAIN).42m" "$(GBC)"
	@# one connector per language, id <app>_<lang>: the language is its program argument
	@for l in $(LANGS); do \
	  bash scripts/write_xcf.sh "$(GAS_APPDIR)" "$(BIN)" "$(FGLDIR)" "$(APP)_$$l" "$(MAIN).42m" "$(GBC)" "$$l"; \
	done
	@if nc -z localhost $(GAS_PORT) >/dev/null 2>&1; then \
	  echo "   httpdispatch already listening on :$(GAS_PORT) - connector picked up automatically"; \
	else \
	  echo "   starting httpdispatch on :$(GAS_PORT) (log: /tmp/$(APP)-httpdispatch.log)"; \
	  ( cd "$(BIN)" && nohup httpdispatch > /tmp/$(APP)-httpdispatch.log 2>&1 < /dev/null & ); \
	  for _ in $$(seq 1 40); do nc -z localhost $(GAS_PORT) >/dev/null 2>&1 && break; sleep 0.5; done; \
	fi
	@echo "   GBC: http://localhost:$(GAS_PORT)/ua/r/$(APP)  (browser language)  or  /ua/r/$(APP)_<lang>, lang in: $(LANGS)"

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

deploy-arc: build dist/index.html gateway-ensure
	mkdir -p "$(GAS_WEBDIR)"
	rm -rf "$(GAS_WEBDIR)"/*
	cp -r dist/. "$(GAS_WEBDIR)"/
	@echo "   React UI: http://localhost:$(GAS_PORT)/$(APP)/index.html  (gateway: $(GATEWAY))"

deploy: deploy-gas deploy-arc

check-gateway:
	@curl -fsS -m 3 $(GATEWAY)/health && echo || { echo "Arc gateway not reachable at $(GATEWAY)"; exit 1; }

# --- Arc gateway as a service -------------------------------------------------
# systemd user unit: starts with your session, restarts on failure. To start it at boot
# without logging in, run once: loginctl enable-linger $(USER)
UNIT_FILE := $(HOME)/.config/systemd/user/$(GATEWAY_UNIT).service

gateway-install:
	@test -f "$(ARC_GATEWAY_DIR)/packages/arc-gateway/dist/cli.js" || { echo "Arc gateway not found in $(ARC_GATEWAY_DIR) (set ARC_GATEWAY_DIR)"; exit 1; }
	@if [ "$(GATEWAY_NODE)" = lts ]; then test -s "$(NVM_DIR)/nvm.sh" || { echo "nvm not found in $(NVM_DIR) (set NVM_DIR, or GATEWAY_NODE=path)"; exit 1; }; \
	  else test -n "$(NODE)" || { echo "node not found (set NODE=/path/to/node)"; exit 1; }; fi
	mkdir -p $(dir $(UNIT_FILE))
	sed -e 's|@APP@|$(APP)|g' -e 's|@PORT@|$(GATEWAY_PORT)|g' -e 's|@UPSTREAM@|http://localhost:$(GAS_PORT)|g' \
	    -e 's|@GATEWAY_DIR@|$(ARC_GATEWAY_DIR)|g' -e 's|@NODE@|$(NODE)|g' -e 's|@NVM_DIR@|$(NVM_DIR)|g' \
	    $(if $(filter lts,$(GATEWAY_NODE)),-e 's|^\#LTS\#||' -e '/^\#PATH\#/d',-e 's|^\#PATH\#||' -e '/^\#LTS\#/d') \
	    scripts/arc-gateway.service.in > $(UNIT_FILE)
	systemctl --user daemon-reload
	systemctl --user enable $(GATEWAY_UNIT)
	systemctl --user restart $(GATEWAY_UNIT)
	@echo "   $(GATEWAY_UNIT) installed: $(UNIT_FILE)"
	@echo "   status: make gateway-status   logs: make gateway-logs"

gateway-uninstall:
	-systemctl --user disable --now $(GATEWAY_UNIT)
	rm -f $(UNIT_FILE)
	systemctl --user daemon-reload

gateway-start:
	systemctl --user start $(GATEWAY_UNIT)

gateway-stop:
	systemctl --user stop $(GATEWAY_UNIT)

gateway-restart:
	systemctl --user restart $(GATEWAY_UNIT)

gateway-status:
	@systemctl --user --no-pager status $(GATEWAY_UNIT) || true
	@curl -fsS -m 3 $(GATEWAY)/health && echo || echo "gateway not answering at $(GATEWAY)"

gateway-logs:
	journalctl --user -u $(GATEWAY_UNIT) -n 50 --no-pager

# Start the gateway only if it is not answering: through the service when installed,
# else directly (log: /tmp/$(GATEWAY_UNIT).log). Never fails the build.
gateway-ensure:
	@if curl -fsS -m 2 $(GATEWAY)/health >/dev/null 2>&1; then \
	  echo "   Arc gateway already answering at $(GATEWAY)"; \
	elif [ -f "$(UNIT_FILE)" ]; then \
	  echo "   starting $(GATEWAY_UNIT) service"; systemctl --user start $(GATEWAY_UNIT) || true; sleep 2; \
	elif [ -f "$(ARC_GATEWAY_DIR)/packages/arc-gateway/dist/cli.js" ] && [ -n "$(NODE)" ]; then \
	  echo "   starting the Arc gateway on :$(GATEWAY_PORT) (log: /tmp/$(GATEWAY_UNIT).log); 'make gateway-install' makes it permanent"; \
	  ( cd "$(ARC_GATEWAY_DIR)" && nohup "$(NODE)" packages/arc-gateway/dist/cli.js --port $(GATEWAY_PORT) --upstream http://localhost:$(GAS_PORT) > /tmp/$(GATEWAY_UNIT).log 2>&1 < /dev/null & ); sleep 2; \
	else \
	  echo "   warning: Arc gateway not running and not found in $(ARC_GATEWAY_DIR)"; \
	fi

clean:
	rm -rf $(BIN) dist
