# ARC_demo

A small Genero BDL program (`main.4gl`) with two front ends built from the same sources:

- **GAS / GBC**: the classic Genero Browser Client UI, served by the Genero Application Server.
- **ARC**: a React UI that drives the running program through the Arc gateway, using a typed contract generated from the `.4gl` and `.per` files.

The 4GL does not know which front end renders it.

## The program

`main.4gl` opens a ring menu (form `portada`) with three options:

| Option | Window | Form | Dialog |
|---|---|---|---|
| Albaranes | `w2` | `form_1.per` | `INPUT ARRAY` over `file_1.json` |
| Descripción | `w3` | `desc.per` | `INPUT` with a text edit |
| Alta | `w4` | `alta.per` | `INPUT` for a customer record |

`confirmar()` (a `MENU ... STYLE="dialog"`) asks the yes/no questions in Descripción and Alta.

## Requirements

- Genero BDL (`fglcomp`, `fglform`, `fglrun`) in `/opt/fourjs/fgl`
- Genero Application Server in `/opt/fourjs/gas`, with `httpdispatch` on port 6394
- Node.js 20+ and npm
- The three Arc client packages in `vendor/` (see below)
- The Arc gateway running on `http://127.0.0.1:9000`, pointed at the GAS:
  `arc-gateway --port 9000 --upstream http://localhost:6394`
- `nc` (used by the Makefile to detect a running `httpdispatch`)

Different install locations or ports can be passed to `make`, for example `make FGLDIR=/opt/fourjs/fgl-6.00.02`.

## Arc packages (`vendor/`)

`vendor/` is not part of this repository: the packages are Four Js software under an evaluation license and cannot be redistributed. Before `npm install`, copy these files from the Four Js Arc example project (`ARC-example-project/web/vendor/`) or ask Four Js for them:

```
vendor/4js-ai-arc-client-0.1.1.tgz
vendor/4js-ai-arc-protocol-0.1.1.tgz
vendor/4js-ai-arc-react-0.1.1.tgz
vendor/LICENSE.txt
```

## Quick start

```bash
npm install            # once: React, Vite and the Arc client packages from vendor/
make deploy            # compile, deploy the GAS connector, build and publish the React UI
```

Then open:

| Version | URL |
|---|---|
| GAS / GBC | http://localhost:6394/ua/r/arc_demo |
| ARC (React) | http://localhost:6394/arc_demo/index.html |

For React development with hot reload, run `make web-dev` and open http://localhost:5173.

## Makefile targets

| Target | What it does |
|---|---|
| `make` / `make build` | Compile `*.4gl` and `*.per` into `bin/`, copy runtime resources (`demo.4st`, `file_1.json`), regenerate the Arc contract |
| `make contract` | Regenerate `src/generated/arc_demo.ts` only |
| `make run` | Run `bin/main.42m` through the Genero Desktop Client (uses `fglprofile.universal`; set `FGLSERVER` if GDC is not on `localhost:0`) |
| `make deploy-gas` | Build, write `arc_demo.xcf` into GAS `appdata/app`, start `httpdispatch` if it is not running |
| `make deploy-arc` | Build, run `npm run build`, copy `dist/` into the GAS `web/arc_demo/` folder |
| `make deploy` | `deploy-gas` + `deploy-arc` |
| `make web-install` | `npm install` |
| `make web-dev` | Vite dev server on port 5173 |
| `make check-gateway` | Check that the Arc gateway answers on `/health` |
| `make clean` | Remove `bin/` and `dist/` |

Variables you can override: `FGLDIR`, `FGLASDIR`, `APP` (application id, default `arc_demo`), `MAIN` (main module, default `main`), `GBC` (GBC customization name, default empty), `GAS_PORT`, `GATEWAY`.

> The application id is `arc_demo`, not `demo`: GAS already ships a sample application called `demo`, which would shadow this one.

## Everyday workflow

1. Edit `main.4gl` or any `.per` file.
2. Run `make deploy`.

`make` recompiles only what changed. Because the Arc contract and the React build depend on the `.4gl` and `.per` files, **any change to them regenerates `src/generated/arc_demo.ts` and rebuilds the UI**. You never have to regenerate the contract by hand.

If you only changed the 4GL logic and not the screens, `make deploy-gas` is enough. Run `make deploy-arc` as well when you changed a form, an action name or a field.

## How the ARC version works

```
React (src/)  <-- WebSocket -->  Arc gateway (:9000)  <-- AUI -->  GAS (:6394)  -->  fglrun main.42m
```

- `useGeneroSession(ArcDemo)` opens a session; the gateway starts the program under the GAS application id `arc_demo`.
- The top window of the stack decides the screen (`w1` menu, `w2` albaranes, `w3` descripción, `w4` alta). Field values come from the window snapshot and are written with `session.fields.<name>.set()`.
- Buttons fire program actions (`accept`, `cancel`, `append`, ...). They are enabled only while the program offers that action.
- Prompts from the program (`confirmar()`, errors) appear as a modal.

### The generated contract

`scripts/generate-contract.mjs` reads `main.4gl` and all `*.per` files and writes `src/generated/arc_demo.ts`:

- `ArcDemo.Forms.<Form>Fields`: typed fields of each form
- `ArcDemo.Fields`: the union of all fields (windows stack, a name is a name wherever it appears)
- `ArcDemo.Action`: `ON ACTION` names, `MENU COMMAND` names (lower case) and the runtime `help`
- `ArcDemoLists`: screen records (`s_consulta`) and their columns

It is a regular-expression parser written for this project. If a new form is misparsed, adjust `scripts/lib/bdl-contract.mjs`. Do not edit the generated file by hand.

### What the contract cannot carry

Labels, combo and radio items, and the layout are not exposed at runtime, so they are written by hand in `src/components/` (`Albaranes.tsx`, `Forms.tsx`). If you change an item list in a `.per` file, update the React component too.

Names of fields must be unique across windows that can be open at the same time, because the gateway resolves a write by name.

## Project layout

```
main.4gl, *.per        Genero sources (UTF-8)
demo.4st, file_1.json  runtime resources, copied to bin/
fglprofile.universal   GDC settings used by `make run`
genv.sh                environment for running without make
gas/app.xcf.in         GAS connector template
scripts/               contract generator and GAS connector writer
src/                   React UI (App.tsx, components/, generated/)
vendor/                Arc client packages (not versioned, see above)
arc_docs/              Arc reference documentation
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
- **Accents look wrong**: all sources are UTF-8, so run the program under a UTF-8 locale (`LANG=es_ES.UTF-8` or similar) for `fglrun` and `httpdispatch`.
- **Changes not visible in the React UI**: run `make deploy-arc` and hard-refresh the page.

## License

The Arc client packages in `vendor/` (not included) are Four Js software under the evaluation license in `vendor/LICENSE.txt`.
