# ARC_demo

A small Genero BDL program (`main.4gl`) with two front ends built from the same sources:

- **GAS / GBC**: the classic Genero Browser Client UI, served by the Genero Application Server.
- **ARC**: a React UI that drives the running program through the Arc gateway, using a typed contract generated from the `.4gl` and `.per` files.

The 4GL does not know which front end renders it.

## The program

`app_demo.4gl` (started by `main.4gl`) opens a ring menu (form `portada`) with three options:

| Option | Window | Form | Dialog |
|---|---|---|---|
| Albaranes | `w2` | `form_1.per` | `INPUT ARRAY` over `file_1.json` |
| Descripción | `w3` | `desc.per` | `INPUT` with a text edit |
| Alta | `w4` | `alta.per` | `INPUT` for a customer record |

`confirmar()` (a `MENU ... STYLE="dialog"`) asks the yes/no questions in Descripción and Alta.

The Alta form (`alta.per`) uses translatable `LABEL` items and a country combobox that is filled by the library function `lib_paises.cargar_paises` (ten countries, `NOT NULL`, default `ES`).

## Requirements

- Genero BDL (`fglcomp`, `fglform`, `fglrun`) in `/opt/fourjs/fgl`
- Genero Application Server in `/opt/fourjs/gas`, with `httpdispatch` on port 6394
- Node.js 20+ and npm
- The three Arc client packages in `vendor/` (see "Files not included" below)
- The Arc gateway running on `http://127.0.0.1:9000`, pointed at the GAS:
  `arc-gateway --port 9000 --upstream http://localhost:6394`
- `fglmkstr` (part of Genero BDL; compiles the translatable strings)
- `nc` (used by the Makefile to detect a running `httpdispatch`)

Different install locations or ports can be passed to `make`, for example `make FGLDIR=/opt/fourjs/fgl-6.00.02`.

## Files not included in the repository

`vendor/` and `arc_docs/` come from the Four Js Arc example project (`ARC-example-project`). They are Four Js material under an evaluation license and cannot be redistributed, so both directories are listed in `.gitignore`.

### `vendor/` (required)

The three Arc client packages that `package.json` installs, plus their license. Copy them from `ARC-example-project/web/vendor/` (or ask Four Js) **before** `npm install`:

```
vendor/4js-ai-arc-client-0.1.1.tgz
vendor/4js-ai-arc-protocol-0.1.1.tgz
vendor/4js-ai-arc-react-0.1.1.tgz
vendor/LICENSE.txt
```

### `arc_docs/` (optional)

Arc reference documentation: `README.md`, `how-it-works.md`, `typed-contract.md` and `build-your-own.md`. Nothing in the build uses it. Copy it from `ARC-example-project/docs/` and `ARC-example-project/web/README.md` if you want it next to the code.

## Quick start

```bash
npm install            # once: React, Vite and the Arc client packages from vendor/
make deploy            # compile, deploy the GAS connector, build and publish the React UI
```

Then open:

| Version | URL |
|---|---|
| GAS / GBC | http://localhost:6394/ua/r/arc_demo (browser language) or `/ua/r/arc_demo_es`, `/ua/r/arc_demo_en` |
| ARC (React) | http://localhost:6394/arc_demo/index.html |

For React development with hot reload, run `make web-dev` and open http://localhost:5173.

## Makefile targets

| Target | What it does |
|---|---|
| `make` / `make build` | Compile `*.4gl` and `*.per` into `bin/`, copy runtime resources (`demo.4st`, `file_1.json`), compile the translations, regenerate the Arc contract and the React dictionary |
| `make strings-extract` | List the translatable keys found in the `.per` and `.4gl` sources |
| `make i18n` | Regenerate `src/generated/i18n.ts` (dictionary of the React UI) from the `.str` files |
| `make contract` | Regenerate `src/generated/arc_demo.ts` only |
| `make run` | Run `bin/main.42m` through the Genero Desktop Client (uses `fglprofile.universal`; set `FGLSERVER` if GDC is not on `localhost:0`) |
| `make deploy-gas` | Build, write `arc_demo.xcf` and one `arc_demo_<lang>.xcf` per language into GAS `appdata/app`, start `httpdispatch` if it is not running |
| `make deploy-arc` | Build, run `npm run build`, copy `dist/` into the GAS `web/arc_demo/` folder |
| `make deploy` | `deploy-gas` + `deploy-arc` |
| `make web-install` | `npm install` |
| `make web-dev` | Vite dev server on port 5173 |
| `make check-gateway` | Check that the Arc gateway answers on `/health` |
| `make gateway-install` | Install and start the Arc gateway as a systemd **user** service (see below) |
| `make gateway-start`, `gateway-stop`, `gateway-status`, `gateway-logs`, `gateway-uninstall` | Manage that service |
| `make gateway-ensure` | Start the gateway if it is not answering (service if installed, otherwise directly). `deploy-arc` runs it |
| `make clean` | Remove `bin/` and `dist/` |

Variables you can override: `GATEWAY_NODE` (`lts` or `path`), `NVM_DIR`, `ARC_GATEWAY_DIR` (checkout of the Arc monorepo, default `../arc-monorepo`), `GATEWAY_PORT`, `GATEWAY_UNIT`, `NODE`, `LANGS` (languages to build, default `es en`), `APPMOD` (module with the program body, default `app_demo`), `FGLDIR`, `FGLASDIR`, `APP` (application id, default `arc_demo`), `MAIN` (main module, default `main`), `GBC` (GBC customization name, default empty), `GAS_PORT`, `GATEWAY`.

> The application id is `arc_demo`, not `demo`: GAS already ships a sample application called `demo`, which would shadow this one.

## Arc gateway as a service

The gateway lives in the Arc monorepo (`ARC_GATEWAY_DIR`, default `../arc-monorepo`, already built). To stop starting it by hand:

```bash
make gateway-install      # writes ~/.config/systemd/user/arc-gateway.service and starts it
make gateway-status       # service state + /health
make gateway-logs         # last 50 lines of the journal
```

The service starts with your session and is restarted if it crashes (a clean stop with `make gateway-stop` is respected). It runs the **newest LTS Node installed in nvm** (`nvm use --lts`, looked up at every start, so a newer LTS is picked up on the next restart; the monorepo requires Node 24 or later). If the newest LTS that nvm knows about is not installed yet (nvm refreshes its LTS aliases whenever it queries the remote list), it falls back to the newest installed Node 24.x. To pin the `node` found in your `PATH` instead, install with `make gateway-install GATEWAY_NODE=path`. `make gateway-install` can be re-run at any time: it rewrites the unit and restarts the service. To start it at boot without logging in, run once `loginctl enable-linger $USER`. The gateway connects to GAS per session, so it does not need `httpdispatch` to be up first.

Without the service, `make deploy` still starts the gateway if nothing answers on `GATEWAY_PORT` (log in `/tmp/arc-gateway.log`; it does not survive a reboot). If a gateway is already running by hand on the port, `gateway-install` would fail to bind: stop the manual one first.

## Languages

The program supports several languages at once (Spanish and English), chosen **per session** with the native Genero mechanism: `base.Application.reloadResources()`.

- `strings/<lang>/arc_demo.str` holds the translatable texts (UTF-8). `make` compiles every language in `LANGS` into `bin/<lang>/arc_demo.42s`.
- `default.4ad` (one file, not one per language) redefines the texts of the default actions (OK, Cancel, Append, ...). Each `<ActionDefault>` has a nested `<LStr text="action.accept" />` whose key is resolved from the same `.str` file, so the actions follow the language of the session.
- `main.4gl` is only the entry point: it asks `lib_idioma.idioma_usuario()` for the language, calls `reloadResources("bin/<lang>")` and then runs `app_demo.4gl`, which contains the program. The split matters: the runtime only translates modules and forms loaded **after** `reloadResources()`, so `main.4gl` must not contain `%"key"` strings.
- The texts are `%"key"` literals in `.per` and `.4gl` files. Menu options use `ON ACTION name ATTRIBUTES(TEXT=%"...")` and not `COMMAND "text"`, so the action names do not depend on the language.

How the language is chosen:

| Front end | Source of the language |
|---|---|
| GBC (`/ua/r/arc_demo`) | The browser language, asked with the `standard.feInfo` front call |
| GDC (`make run`) | The operating system language, same front call |
| Arc (React) | The connector it opens: `arc_demo_<lang>` (`arc_demo_es`, `arc_demo_en`), whose program argument is the language |
| Fixed language in GBC | Open `/ua/r/arc_demo_<lang>` |

`make deploy-gas` writes one connector per language. If nothing says otherwise, the default language is the first of `LANGS`.

The React UI has a language selector. It remembers the choice in the browser (and starts with the browser language the first time); changing it opens a new session, because the program fixes its language when it starts. The texts of the React-only parts (labels, combobox items, window titles) come from `src/generated/i18n.ts`, generated from the same `.str` files, so 4GL and React share keys and translations. The texts the program sends itself (menus, messages, prompts, action labels) arrive already translated.

To add a language: copy `strings/es/` to `strings/<code>/`, translate it, add the code to `LANGS` in the `Makefile` and to `C_IDIOMAS` in `lib_idioma.4gl`, and run `make deploy`. `make strings-extract` lists the keys the sources use. A key missing from a `.str` file is shown as the raw key.

> **Arc limitation:** the Arc gateway does not deliver front calls made before the first dialog of the program, and the program would wait forever. For that reason `lib_idioma` does not ask the front end when it runs under Arc, and the language must come from the connector. Opening the plain `arc_demo` id from Arc gives the default language.

## Everyday workflow

1. Edit `app_demo.4gl` (or another `.4gl`) or any `.per` file.
2. Run `make deploy`.

`make` recompiles only what changed. Because the Arc contract and the React build depend on the `.4gl` and `.per` files, **any change to them regenerates `src/generated/arc_demo.ts` and rebuilds the UI**. You never have to regenerate the contract by hand.

If you only changed the 4GL logic and not the screens, `make deploy-gas` is enough. Run `make deploy-arc` as well when you changed a form, an action name or a field.

## How the ARC version works

```
React (src/)  <-- WebSocket -->  Arc gateway (:9000)  <-- AUI -->  GAS (:6394)  -->  fglrun main.42m
```

- `useGeneroSession(ArcDemo)` opens a session; the gateway starts the program under the GAS application id `arc_demo`.
- `useGeneroSession` opens the connector of the chosen language (`arc_demo_<lang>`).
- The top window of the stack decides the screen (`w1` menu, `w2` albaranes, `w3` descripción, `w4` alta). Field values come from the window snapshot and are written with `session.fields.<name>.set()`.
- Buttons fire program actions (`accept`, `cancel`, `append`, ...). They are enabled only while the program offers that action.
- Prompts from the program (`confirmar()`, errors) appear as a modal.

### The generated contract

`scripts/generate-contract.mjs` reads `app_demo.4gl` and all `*.per` files and writes `src/generated/arc_demo.ts`:

- `ArcDemo.Forms.<Form>Fields`: typed fields of each form
- `ArcDemo.Fields`: the union of all fields (windows stack, a name is a name wherever it appears)
- `ArcDemo.Action`: `ON ACTION` names, `MENU COMMAND` names (lower case) and the runtime `help`; taken from `app_demo.4gl`
- `ArcDemoLists`: screen records (`s_consulta`) and their columns

It is a regular-expression parser written for this project. If a new form is misparsed, adjust `scripts/lib/bdl-contract.mjs`. Do not edit the generated file by hand.

### What the contract cannot carry

Labels, combo and radio items, window titles and the layout are not exposed at runtime, so the React components (`Albaranes.tsx`, `Forms.tsx`, `App.tsx`) carry them. Their texts come from the `.str` files through `t('key')`, but the list of keys and codes (country codes, status codes) is copied by hand: if you change an item list in a `.per` file or `lib_paises.4gl`, update the React component too.

Names of fields must be unique across windows that can be open at the same time, because the gateway resolves a write by name.

## Project layout

```
main.4gl               entry point: sets the language, then runs app_demo
app_demo.4gl           program body (menu and windows)
lib_idioma.4gl         library: language of the session
*.per                  forms (UTF-8)
lib_paises.4gl         library module: combobox initializer with ten countries
strings/<lang>/        translations (arc_demo.str)
demo.4st, file_1.json  runtime resources, copied to bin/
fglprofile             runtime profile for GAS (loads arc_demo.42s)
default.4ad            default action texts, translated through <LStr> keys
fglprofile.universal   GDC settings used by `make run`
genv.sh                environment for running without make
gas/app.xcf.in         GAS connector template
scripts/               contract generator and GAS connector writer
src/                   React UI (App.tsx, components/, generated/)
vendor/                Arc client packages (not versioned, see above)
arc_docs/              Arc reference documentation (not versioned, optional)
bin/, dist/            build output (not versioned)
```

## Configuration

Copy `.env.example` to `.env.local` to point the React UI at another gateway:

```
VITE_ARC_GATEWAY=http://127.0.0.1:9000
VITE_ARC_TOKEN=dev
```

The values are baked into the build, so run `make deploy-arc` again after changing them. The gateway must allow the origin of the page (CORS) and accept WebSocket connections.

## Troubleshooting

- **A different program opens** (the "Sample1 demo"): the application id collides with an existing GAS app. Keep `APP=arc_demo` or choose an unused id.
- **`Arc gateway not reachable`**: start the gateway and check it with `make check-gateway`.
- **Connecting… never ends in the browser**: the gateway cannot reach GAS, or `arc_demo.xcf` is missing. Run `make deploy-gas` and open the GBC URL to confirm the program starts.
- **A language does not change in GBC**: GBC uses the browser language; open `/ua/r/arc_demo_<lang>` to force one.
- **Raw keys such as `menu.sal` on screen**: the key is missing from `strings/<lang>/arc_demo.str`, or the `.42s` was not rebuilt (`make`).
- **Accents look wrong**: all sources are UTF-8, so run the program under a UTF-8 locale (`LANG=es_ES.UTF-8` or similar) for `fglrun` and `httpdispatch`.
- **Changes not visible in the React UI**: run `make deploy-arc` and hard-refresh the page.

## License

The Arc client packages in `vendor/` and the documentation in `arc_docs/` (neither included) are Four Js software under the evaluation license in `vendor/LICENSE.txt`.
